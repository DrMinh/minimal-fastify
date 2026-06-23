import fastify, { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        serviceFactory: ServiceFactory;
    }
}

export class ServiceFactory {

    serviceInstances = new Map<Function, unknown>();

    constructor(public fastify: FastifyInstance) {

    }

    getService<T>(ServiceClass: new (fastify: FastifyInstance) => T): T {
        if (!this.serviceInstances.has(ServiceClass)) {
            this.serviceInstances.set(ServiceClass, new ServiceClass(this.fastify));
        }
        return this.serviceInstances.get(ServiceClass) as T;
    }
}

async function serviceFactory(fastify: FastifyInstance, option: any) {
    fastify.decorate('serviceFactory', new ServiceFactory(fastify));
}

export const ServiceFactoryPlugin = serviceFactory as FastifyPluginAsync;