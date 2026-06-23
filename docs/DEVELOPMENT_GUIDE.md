# ToolImageProcessing\_BE

This project uses **Fastify** and **MongoDB**, and follows a **Controller-Service pattern** to keep the code modular and scalable.

## Requirements

* Node.js >= 23.0
* MongoDB

### Folder Structure

* **config/**: Core configuration files for the project. These rarely need to be modified.
* **controller/**: Contains all controller classes that handle user requests and send responses.
* **database/**: Includes files that run during `npm run migrate`, typically used to initialize or seed the database.
* **decorators/**: Functions that extend Fastify instance methods. These are typically stable and rarely need changes.
* **libs/**: Utility or helper libraries that can be reused across different parts of the project or in other projects.
* **models/**: Database models using `mongoose`. Define new collections here as needed.
* **routes/**: Defines the API endpoints and maps them to corresponding controller methods.
* **schemas/**: Contains all request/response schemas (using `typebox`) to define the data structure shared between client and server.
* **services/**: Contains business logic. All services are singletons and accessed via the Fastify instance:

  ```js
  fastify.serviceFactory.getService(OrderService).createOrder(data);
  ```
* **types/**: Contains custom types and interfaces used throughout the project.

---

## ESM Module
The project follows the ECMAScript Modules (ESM) specification. All import statements must reference `.js` files, not `.ts` files.

```ts
import { ExampleContainer } from "@src/containers/index.js";
```

Extensionless imports and directory imports are not supported in ESM. Every import must explicitly reference the `.js` file.

```ts
// ❌ Wrong
import { ExampleContainer } from "@src/containers";
import { ExampleContainer } from "@src/containers/index";
import { ExampleContainer } from "@src/containers/index.ts";

// ✅ Right
import { ExampleContainer } from "@src/containers/index.js";
```

---

## Adding a New API Endpoint

### 1. Create a Schema for Client Request

Create a new file in the `schemas/` folder:

```ts
// test.schema.ts
import { Static, Type } from '@fastify/type-provider-typebox';

export const TestPostSchema = Type.Object({
  postString: Type.String({ minLength: 1 }),
  postNumber: Type.Number()
});

export type TestPostType = Static<typeof TestPostSchema>;
```

### 2. Create a New Controller

Add a file to the `controllers/` folder:

```ts
// test.controller.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TestPostType } from "../schemas/index.js";

export class TestController {
  constructor(public fastify: FastifyInstance) {}

  async testPost(
    request: FastifyRequest<{ Body: TestPostType; Reply: any }>,
    reply: FastifyReply
  ) {
    // Return the request body back to the client
    return { result: request.body };
  }
}
```

### 3. Create a New Route

Add a new file in the `routes/` folder:

```ts
// test.routes.ts
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest
} from "fastify";
import { TestPostSchema } from "../schemas/index.js";
import { TestController } from "../controllers/index.js";

export async function testRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const testController = new TestController(fastify);

  fastify.post(
    "/test/test-post",
    {
      schema: {
        body: TestPostSchema // Validates request body
      },
      preHandler: fastify.customJwtAuth // Optional: require user auth
    },
    testController.testPost.bind(testController) // Route handler
  );
}
```

> **Note:** Don't forget to `export *` from the new route file in `routes/index.ts` so it will be automatically registered.

```ts
// routes/index.ts
export * from './test.route.js';
```

---

## Using the Database

### 1. Configure Database Connection

Edit your `.env` file and set the connection string:

```env
MONGO_DB_CONNECTION_STRING = 'mongodb://0.0.0.0:27017/my-database-name'
```

### 2. Create a New Model

Add a new file in the `models/` folder. Models are defined with **Mongoose**. Spread `BaseSchemaFields` for the shared `status` field, and pass `BaseTimestamps` so Mongoose maintains `createdDate` / `updatedDate` automatically:

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
  },
  {
    collection: UserCollectionName,
    ...BaseTimestamps,
  },
);

export type User = InferSchemaType<typeof userSchema> & BaseDocument;

export const UserModel = model<User>('User', userSchema);
```

### 3. Create Data

Mongoose populates schema defaults automatically when you `create` or `new` a document. `createdDate` / `updatedDate` are managed by the `timestamps` option:

```ts
const user = await UserModel.create({ name: 'ABC', password: 'longpassword', email: 'a@b.c' });
```

Schema-level validators (`required`, `minlength`, `enum`, …) run on save by default — there is no separate "assert" step.

### 4. Accessing a Model in a Service or Controller

Retrieve a Mongoose model from the Fastify instance using the `getMongoModel` helper.
This validates the connection state and returns the model with full type safety.

```ts
this.userModel = fastify.getMongoModel(UserModel);
await this.userModel.create(data);
```

When used inside a class (service or controller), the recommended pattern is to inject the model directly through the constructor:

```ts
export class UserService {

    constructor(
        public fastify: FastifyInstance,
        public userModel = fastify.getMongoModel(UserModel)
    ) {}

}
```

This approach removes the need to manually check the connection in every service. It keeps services concise while providing type-safe access to MongoDB through Mongoose.


---

## Writing a Service

A service is a class that contains business logic for the project, such as creating, editing, or deleting users, orders, etc.

All services in the project are **singletons** and accessed through the Fastify service factory.

### 1. Create a Service Class

Add your service in the `services/` folder:

```ts
export class TestService {
  counter = 10;

  constructor() {}

  // simgple method use to count number
  addCount() {
    return this.counter++;
  }
}
```

### 2. Using a Service

To use a service, retrieve the singleton instance through Fastify:

```ts
const a = fastify.serviceFactory.getService(TestService).addCount(); // 10
const b = fastify.serviceFactory.getService(TestService).addCount(); // 11
```

This ensures all parts of the project share the same instance of the service.
