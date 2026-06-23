import { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as allRoutes from '../routes/index.js';

type Route = (fastify: FastifyInstance, options: FastifyPluginOptions) => Promise<void> | void;

export async function routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    const routeModules = allRoutes as Record<string, Route>;

    for (const routeName in routeModules) {
        const route = routeModules[routeName];
        if (typeof route === "function") {
            fastify.register(route);
        } else {
            console.warn(`Skipped ${routeName}: Not a function`);
        }
    }
}