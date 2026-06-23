import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { EnvSchema } from './env.js';
import { migrateDatabase } from '../database/index.js';

declare module 'fastify' {
    interface FastifyInstance {
        mongoose: typeof mongoose;
    }
}

export async function configMongoDB(fastify: FastifyInstance) {

    const envs = fastify.getEnvs<EnvSchema>();

    await mongoose.connect(envs.MONGO_DB_CONNECTION_STRING);

    fastify.decorate('mongoose', mongoose);

    fastify.addHook('onClose', async () => {
        await mongoose.disconnect();
    });

    if (envs.RUN_MIGRATE) {
        await migrateDatabase(fastify);
    }
}
