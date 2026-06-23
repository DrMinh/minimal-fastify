import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { routes } from './configs/route-loader.js';
import { configEnv, configMongoDB, EnvSchema } from './configs/index.js';
import { configJwt, MongoModelPlugin, ServiceFactoryPlugin } from './decorators/index.js';
import { fileURLToPath } from "url";
import { mkdir, writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildApp(opts = {}) {
    const fastify = Fastify({
        bodyLimit: 104857600, // 100 MiB
        ajv: {
            customOptions: {
                coerceTypes: 'array'
            }
        },
        ...opts,
    }).withTypeProvider<TypeBoxTypeProvider>();

    // Register plugins
    fastify.register(cors, { origin: '*' });
    fastify.register(fastifySensible);
    fastify.register(fastifyMultipart, { attachFieldsToBody: 'keyValues' });

    // Simple root route
    fastify.get('/', (request, reply) => {
        reply.send({ hello: 'world' });
    });

    // Configs
    await configEnv(fastify);
    await configMongoDB(fastify);
    configJwt(fastify);
    await fastify.register(fp(ServiceFactoryPlugin));
    await fastify.register(MongoModelPlugin);

    fastify.register(fastifyStatic, {
        root: path.join(__dirname, '../public/'),
        prefix: '/public/'
    });

    // Load application routes
    fastify.register(routes);

    return fastify;
}
