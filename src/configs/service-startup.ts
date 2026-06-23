import { FastifyInstance } from "fastify";

export async function startService(fastify: FastifyInstance) {
    // some serive can can method here when start-up
    // await fastify.serviceFactory.getService(WebsocketService).start();
}