import { errorCodes, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import sharp from "sharp";
import { ExampleService } from "@src/services/index.js";
import { SuccessResponse } from "@src/types/index.js";
import { ExampleGetType, ExamplePostType, ExampleUploadBodySchema, ExampleUploadBodyType } from "@src/schemas/index.js";

export class ExampleController {

    constructor(
        public fastify: FastifyInstance,
        public exampleService = fastify.serviceFactory.getService(ExampleService)
    ) { }

    async testGet(
        request: FastifyRequest<{ Querystring: ExampleGetType }>,
    ): Promise<SuccessResponse<{ count: number }>> {
        console.log('get data', request.query);
        return {
            message: 'get ok',
            statusCode: 200,
            data: {
                count: this.exampleService.addCount()
            }
        }
    }

    async testPost(
        request: FastifyRequest<{ Body: ExamplePostType }>,
        reply: FastifyReply
    ): Promise<SuccessResponse<{ resultString: string, resultNumber: number }>> {
        //return this.fastify.httpErrors.unprocessableEntity('error message');
        return {
            statusCode: 200,
            message: 'this is ok message',
            data: {
                resultString: request.body.postString,
                resultNumber: request.body.postNumber
            }
        };
    }

    async testFile(
        request: FastifyRequest<{ Body: ExampleUploadBodyType }>,
        reply: FastifyReply
    ) {
        let fileBuffers = (request as any).body!.myFile as any[];

        if (!Array.isArray(fileBuffers)) {
            fileBuffers = [fileBuffers];
        }

        console.log(typeof fileBuffers[0], fileBuffers[0])

        for (const fileBuffer of fileBuffers) {
            const metadata = await sharp(fileBuffer).metadata();
            if (metadata.width && metadata.height && metadata.width > 0 && metadata.height > 0) {
                continue;
            }
            throw new Error('File is not real image');
        }

        return {
            message: 'upload ok',
            statusCode: 200,
            data: {
                fileCount: fileBuffers.length
            }
        }
    }

}