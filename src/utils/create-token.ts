import { FastifyInstance } from "fastify";
import { TokenPayloadType } from "../types/index.js";

/**
 * 
 * @param fastify 
 * @param payload 
 * @param expiresIn second before expired
 * @returns 
 */
export function createToken(fastify: FastifyInstance, payload: TokenPayloadType, expiresIn: number) {
    const token = fastify.jwt.sign({ payload }, { expiresIn: expiresIn });
    const expiresAt = Date.now() + expiresIn * 1000;
    return {
        token,
        expiresAt,
        userId: payload.userId,
        role: payload.role,
        scope: payload.scope.split(' ')
    };
}