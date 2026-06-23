import fastifyEnv from '@fastify/env';
import { Static, Type } from '@fastify/type-provider-typebox';
import { FastifyInstance } from 'fastify';

// Define the schema using TypeBox
const schema = Type.Object(
  {
    NODE_ENV: Type.Union([
      Type.Literal('development'),
      Type.Literal('production'),
      Type.Literal('test'),
    ]),
    PORT: Type.Number({ default: 3000 }),
    HOST: Type.Optional(Type.String()),
    JWT_SECRET: Type.String(),
    PASSWORD_SECRET: Type.String(),
    MONGO_DB_CONNECTION_STRING: Type.String(),

    WEBSOCKET_PORT: Type.Number({ default: 3000 }),

    SERVER_HOST: Type.String(),

    /** if true, it will run all migrate file */
    RUN_MIGRATE: Type.Optional(Type.Boolean()), 
    
  },
  { additionalProperties: true },
);

// Extract TypeScript type from the schema
export type EnvSchema = Static<typeof schema>;

declare module 'fastify' {
  interface FastifyInstance {
    envs: EnvSchema;
  }
}

export async function configEnv(fastify: FastifyInstance) {
  await fastify.register(fastifyEnv, { schema: schema, dotenv: true });

  fastify.decorate('envs', fastify.getEnvs<EnvSchema>());

  console.log('ENV setup successful');
}
