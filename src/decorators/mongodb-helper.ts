import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import mongoose, { Model } from 'mongoose';

declare module 'fastify' {
    interface FastifyInstance {
        getMongoModel<T extends Model<any>>(model: T): T;
    }
}

const mongoModelPlugin: FastifyPluginAsync = async (fastify) => {

    fastify.decorate(
        'getMongoModel',
        function <T extends Model<any>>(this: FastifyInstance, model: T): T {

            if (mongoose.connection.readyState !== 1) {
                throw new Error('Mongo DB is not connected');
            }

            return model;
        }
    );

};

export const MongoModelPlugin = fp(mongoModelPlugin);
