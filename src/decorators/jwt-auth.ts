import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { EnvSchema } from "../configs/env.js";
import fastifyJwt from "@fastify/jwt";
import { AsyncFunction } from "fastify/types/instance.js";
import { TokenPayloadType, TokenUserType } from "../types/index.js";

async function auth(
    request: FastifyRequest<{ Body: any, Reply: any, Querystring: any, Params: any }>,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
}

export function requireRole(roles: string[]) {
    return async function (
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const user = request.user

        if (!user) {
            throw reply.unauthorized()
        }

        if (!roles.includes(user.payload.role)) {
            throw reply.forbidden('no permission')
        }
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        customJwtAuth: typeof auth;
        requireRole: typeof requireRole;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: TokenUserType
    }
}

export function configJwt(fastify: FastifyInstance) {
    const envData = fastify.getEnvs<EnvSchema>();

    fastify.register(
        fastifyJwt,
        {
            secret: envData.JWT_SECRET,
            sign: {
                expiresIn: '1m'
            }
        }
    );

    fastify.decorate("customJwtAuth", auth);
    fastify.decorate("requireRole", requireRole);
}