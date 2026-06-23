# CODING\_GUIDELINES.md

This document provides coding guidelines for working on this project. Following these conventions helps ensure a consistent and maintainable codebase that is easy for all team members to understand and extend.

---

## Write Business Logic in Services

Controllers can access request data and handle responses, but all core business logic should be placed in service classes. This keeps controllers lightweight and allows logic to be reused elsewhere via the Fastify instance:

```ts
// everywhere can add user
fastify.serviceFactory.getService(UserService).addUser(user);
```

---

## Validate All API Requests with Schemas

Only accept requests that match the schema definitions. This ensures type safety and consistent request structure.

---

## Export Everything in `index.ts`

Every folder should have an `index.ts` that exports its contents. Always use `export *` in `index.ts` files, even if the code works without it. This simplifies imports and reduces boilerplate:

```ts
// Good
export * from './example.controller.js';

// Then elsewhere
import { TestController } from '../controllers/index.js';
```

> **Note:** All route files must be exported in `routes/index.ts`, or they won't be automatically registered by the server.

---

## Use Default Error Handling

When your logic encounters an error, respond using Fastify’s built-in error handling to ensure a consistent error format across all endpoints:

```ts
{
  "statusCode": number,
  "error": string,
  "message": string
}
```

You can achieve this in one of the following ways:

* Throw a standard error (results in a 500 error):

```ts
throw new Error('Unexpected failure');
```

* Use `@fastify/sensible` for structured error responses:

```ts
return fastify.httpErrors.notFound('Your data is not found');
```

---


By following these guidelines, we ensure a modular and scalable architecture that can be easily maintained and understood by all contributors.
