import { Static, Type } from "@fastify/type-provider-typebox";

// Define the enum for role
export enum UserRole {
    System = 'system',
    User = 'user',
    Admin = 'admin'
}

// Define the schema
export const TokenPayloadSchema = Type.Object({
    userId: Type.Optional(Type.String()),   // userId is an optional string
    role: Type.Enum(UserRole),              // role is an enum of UserRole
    scope: Type.String()                    // scope is a space-separated string
});

export type TokenPayloadType = Static<typeof TokenPayloadSchema>;


// Define the schema
export const TokenUserSchema = Type.Object({
    payload: TokenPayloadSchema,
    iat: Type.Number(), // Issued at time
    exp: Type.Number()  // Expiration time
});

export type TokenUserType = Static<typeof TokenUserSchema>;