import { Static, Type } from "@fastify/type-provider-typebox";

///////
export const ExampleGetSchema = Type.Object({
    /** query string */
    'post-string': Type.String({ minLength: 1 }),

    /** query numbers array */
    'post-numbers': Type.Array(Type.Number())
});

export type ExampleGetType = Static<typeof ExampleGetSchema>;

///////
export const ExamplePostSchema = Type.Object({
    postString: Type.String({ minLength: 1 }),
    postNumber: Type.Number()
});

export type ExamplePostType = Static<typeof ExamplePostSchema>;

////////
export const ExampleUploadBodySchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    myFile: Type.Union([
        Type.Any(),
        Type.Array(Type.Any())
    ])
});

export type ExampleUploadBodyType = Static<typeof ExampleUploadBodySchema>;
