# Migration: `@fastify/mongodb` + TypeBox models → Mongoose

This is a recipe for an LLM (or human) to convert a sibling Fastify project that follows the same layout as this repo. The reference migration was completed in `apac/minimal-fastify`.

## Scope

- **Replace** the DB layer: connection, models, helper, migrations.
- **Keep** `src/schemas/` untouched. TypeBox there is for HTTP request/response validation, which is a Fastify concern, not a DB concern.
- **Keep** `typebox` and `@fastify/type-provider-typebox` deps. They are still used by `src/schemas/` and by any `Value.Assert` runtime checks (e.g. websocket message handlers).
- **Drop** `@fastify/mongodb`.

The "nice interface" goal: services keep injecting their data handle through the constructor. Old:

```ts
public userCollection = fastify.getMongoCollection<User>(UserCollectionName)
```

New:

```ts
public userModel = fastify.getMongoModel(UserModel)
```

## Pre-flight grep

Before editing, sweep the project to size the change:

```
getMongoCollection | fastify\.mongo | @fastify/mongodb | from 'typebox' | from "typebox"
MongoId | CustomUint8Array | DateType | BaseModel
```

Anything in `src/schemas/` is out of scope. Anything else is in scope.

## File-by-file changes

### 1. `src/types/common.ts`
Drop the TypeBox refines (`MongoId`, `DateType`, `CustomUint8Array`) and the `typebox` / `typebox/value` imports. Keep enums like `CollectionStatus`. Final file is just enum declarations.

### 2. `src/types/constants.ts`
Replace `import { ObjectId } from '@fastify/mongodb'` with `import { Types } from 'mongoose'`. Use `new Types.ObjectId('000000000000000000000000')`.

### 3. `src/utils/base-model.ts`
Replace the TypeBox `BaseModel` with three exports for spreading into Mongoose schemas:

```ts
import { SchemaDefinitionProperty } from 'mongoose';
import { CollectionStatus } from '../types/common.js';

export interface BaseDocument {
    status: CollectionStatus;
    createdDate: Date;
    updatedDate: Date;
}

export const BaseSchemaFields = {
    status: {
        type: String,
        enum: Object.values(CollectionStatus),
        default: CollectionStatus.Active,
        required: true,
    } as SchemaDefinitionProperty<CollectionStatus>,
} as const;

export const BaseTimestamps = {
    timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' },
} as const;
```

`createdDate` / `updatedDate` are managed by Mongoose's `timestamps` option — do not declare them as schema fields.

### 4. `src/models/*.model.ts`
Convert each model. Pattern:

```ts
import { InferSchemaType, model, Schema } from 'mongoose';
import { BaseDocument, BaseSchemaFields, BaseTimestamps } from '@src/utils/base-model.js';

export const UserCollectionName = 'users';

const userSchema = new Schema(
    {
        ...BaseSchemaFields,
        name: { type: String, required: true, minlength: 1 },
        password: { type: String, required: true, minlength: 10 },
        email: { type: String, required: true, unique: true },
        // enums:
        role: { type: String, enum: Object.values(UserRole), default: UserRole.User, required: true },
        // string array enums:
        scope: {
            type: [{ type: String, enum: Object.values(UserScope) }],
            default: [UserScope.Buy, UserScope.Sell],
            required: true,
        },
    },
    {
        collection: UserCollectionName,
        ...BaseTimestamps,
    },
);

export type User = InferSchemaType<typeof userSchema> & BaseDocument;

export const UserModel = model<User>('User', userSchema);
```

Notes:
- Keep the `XCollectionName` export — migrations and other call sites reference it.
- Move uniqueness onto schema fields (`unique: true`) instead of declaring it manually in migrations.
- TypeBox `Type.Evaluate(Type.Intersect([BaseSchema, Type.Object({...})]))` collapses to spreading `BaseSchemaFields` into the new Schema definition.

### 5. `src/decorators/mongodb-helper.ts`
Replace `getMongoCollection<T>(name)` with `getMongoModel(model)`. Rename the exported plugin to `MongoModelPlugin`.

```ts
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import mongoose, { Model } from 'mongoose';

declare module 'fastify' {
    interface FastifyInstance {
        getMongoModel<T extends Model<any>>(model: T): T;
    }
}

const mongoModelPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate(
        'getMongoModel',
        function <T extends Model<any>>(this: FastifyInstance, model: T): T {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('Mongo DB is not connected');
            }
            return model;
        },
    );
};

export const MongoModelPlugin = fp(mongoModelPlugin);
```

The helper is intentionally a passthrough that gates on connection state — the value it adds is the connection check and a single chokepoint, exactly like the old helper.

### 6. `src/configs/database.ts`
Replace the `@fastify/mongodb` register with a Mongoose connect:

```ts
import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { EnvSchema } from './env.js';
import { migrateDatabase } from '../database/index.js';

declare module 'fastify' {
    interface FastifyInstance {
        mongoose: typeof mongoose;
    }
}

export async function configMongoDB(fastify: FastifyInstance) {
    const envs = fastify.getEnvs<EnvSchema>();

    await mongoose.connect(envs.MONGO_DB_CONNECTION_STRING);

    fastify.decorate('mongoose', mongoose);

    fastify.addHook('onClose', async () => {
        await mongoose.disconnect();
    });

    if (envs.RUN_MIGRATE) {
        await migrateDatabase(fastify);
    }
}
```

### 7. `src/database/index.ts`
Migrations now receive the `Mongoose` instance, not a `Db`. Import `mongoose` directly:

```ts
import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import * as migrations from './migrations/index.js';

export async function migrateDatabase(fastify: FastifyInstance) {
    console.log('START MIGRATE');
    for (const migrateFuncName in migrations) {
        await (migrations as any)[migrateFuncName](mongoose);
    }
    console.log('MIGRATE DONE!');
    process.exit(0);
}
```

### 8. `src/database/migrations/*.ts`
Each migration takes `mongoose: Mongoose`. Replace manual `db.collection(name).createIndex(...)` with `XModel.syncIndexes()`:

```ts
import { UserModel } from '@src/models/user.model.js';
import { Mongoose } from 'mongoose';

export async function init_db(mongoose: Mongoose) {
    console.log('run migrate');
    await UserModel.syncIndexes();
    // add more models here as the project grows
}
```

`syncIndexes` reads the index declarations off the Mongoose schema, drops orphans, and creates anything new. Per-model uniqueness/compound indexes belong on the schema, not in the migration.

### 9. `src/app.ts`
Two edits — swap the import and the register call:

```ts
import { configJwt, MongoModelPlugin, ServiceFactoryPlugin } from './decorators/index.js';
// ...
await fastify.register(MongoModelPlugin);
```

### 10. `package.json`
Remove `@fastify/mongodb`. Keep `mongoose`, `typebox`, `@fastify/type-provider-typebox`. Run `npm install`.

### 11. `docs/DEVELOPMENT_GUIDE.md` (if present)
Rewrite the "Create a New Model" and "Accessing a Collection" sections to show the Mongoose pattern: `new Schema(...)` + `model(...)`, `await UserModel.create(data)`, and `fastify.getMongoModel(UserModel)` injection.

## Verify

```
npx tsc --noEmit
```

If clean, the migration is done. The reference run came out clean on first build.

## Service injection pattern (after migration)

```ts
export class UserService {
    constructor(
        public fastify: FastifyInstance,
        public userModel = fastify.getMongoModel(UserModel),
    ) {}

    async createUser(data) {
        return this.userModel.create(data);
    }
}
```

## Gotchas

- `typebox/value`'s `Value.Assert` may still appear in websocket / message-handling code. That's HTTP-side validation — leave it alone.
- If a service currently reaches into `fastify.mongo.db` directly, swap it for `fastify.getMongoModel(XModel)`.
- Don't ship a string-based lookup shim like `getMongoCollection('users')` that returns a Mongoose model. Pass the model class itself — it's strictly typed and there's nothing to look up.
- Field-level Mongoose validators (`required`, `minlength`, `enum`) only run on `save` / `create` / `findOneAndUpdate({ runValidators: true })`. The old `Value.Repair` / `Value.Assert` pattern is gone — there is no separate assert step.
