---
name: add-endpoint
description: Use when the user asks to add a new Fastify endpoint, route, or HTTP handler to this project. Scaffolds the schema → controller → route trio following the existing example.* pattern.
---

# add-endpoint

Adds a new HTTP endpoint to this Fastify project. The codebase follows a strict three-layer pattern — do not deviate.

## Before you start

Ask the user (only what isn't already obvious from their request):
1. **Resource name** in singular kebab-case (e.g. `user-profile`). All file/symbol names derive from this.
2. **Method + path** (e.g. `POST /api/user-profile`).
3. **Request shape** (querystring / body / params fields with types).
4. **Response shape**.
5. **Auth?** If yes, uncomment the `preHandler: fastify.customJwtAuth` line.

If they only gave method + path, infer the rest and confirm in one sentence before writing files.

## Files to create / modify

For resource `<name>` (PascalCase: `<Name>`, camelCase: `<nameCamel>`):

1. **Schema** — [src/schemas/\<name\>.schema.ts](src/schemas/)
   - Use `Type.Object` from `@fastify/type-provider-typebox`.
   - Export both the schema constant (`<Name>BodySchema`) and the `Static<>` type (`<Name>BodyType`).
   - Add `export * from './<name>.schema.js'` to [src/schemas/index.ts](src/schemas/index.ts).

2. **Controller** — [src/controllers/\<name\>.controller.ts](src/controllers/)
   - Class `<Name>Controller` with `constructor(public fastify: FastifyInstance, public <name>Service = fastify.serviceFactory.getService(<Name>Service))`.
   - Each handler returns `Promise<SuccessResponse<...>>` from `@src/types/index.js`.
   - Throw via `this.fastify.httpErrors.*` (sensible plugin) — do not return error objects.
   - Add `export * from './<name>.controller.js'` to [src/controllers/index.ts](src/controllers/index.ts).

3. **Route** — [src/routes/\<name\>.route.ts](src/routes/)
   - `export async function <nameCamel>Routes(fastify, options)`.
   - Instantiate controller once: `const controller = new <Name>Controller(fastify);`.
   - Bind handlers: `controller.method.bind(controller)`.
   - Attach schemas under `{ schema: { body / querystring / params } }`.
   - Add `export * from './<name>.route.js'` to [src/routes/index.ts](src/routes/index.ts).

4. **Register** the route plugin wherever existing route plugins are registered (grep [src/app.ts](src/app.ts) for `exampleRoutes` and add yours alongside).

## Conventions — do not break

- **ESM imports** must include `.js` extensions even though sources are `.ts`.
- Use **path alias `@src/...`** inside controllers/services (matches `tsc-alias` config), but **relative imports** inside route files (matches existing example).
- File handlers: bodies are buffers via `@fastify/multipart` — see [src/controllers/example.controller.ts](src/controllers/example.controller.ts) lines 42-69.
- Never wrap handlers in `try/catch` for the sole purpose of returning a generic 500 — let Fastify's error handler catch.

## After scaffolding

Run `npm run build` and report any TypeScript errors. Do not start the dev server unless the user asks.

## Reference

The canonical example to mirror: [src/routes/example.route.ts](src/routes/example.route.ts), [src/controllers/example.controller.ts](src/controllers/example.controller.ts), [src/schemas/example.schema.ts](src/schemas/example.schema.ts).
