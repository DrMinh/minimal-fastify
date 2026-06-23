import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { ExampleGetSchema, ExamplePostSchema, ExampleUploadBodySchema } from '../schemas/index.js';
import { ExampleController } from '../controllers/index.js';
import sharp from 'sharp';

export async function exampleRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

    const controller = new ExampleController(fastify);

    fastify.get(
        '/api/test/test-get',
        {
            schema: {
                querystring: ExampleGetSchema
            }
        },
        controller.testGet.bind(controller)
    );

    fastify.post(
        '/api/test/test-post',
        {
            schema: {
                body: ExamplePostSchema
            },
            //preHandler: fastify.customJwtAuth
        },
        controller.testPost.bind(controller)
    );

    fastify.post(
        '/api/test/test-upload',
        {
            schema: {
                consumes: ['multipart/form-data'],
                body: ExampleUploadBodySchema
            },
            //preHandler: fastify.customJwtAuth
        },
        controller.testFile.bind(controller)
    );
}