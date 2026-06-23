import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import * as migrations from './migrations/index.js';

export async function migrateDatabase(fastify: FastifyInstance) {

    console.log('START MIGRATE');

    for (const migrateFuncName in migrations) {
        await (migrations as any)[migrateFuncName](mongoose);
    }

    console.log('MIGRATE DONE!');

    process.exit(0);
}
