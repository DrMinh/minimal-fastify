// src/index.ts
import { buildApp } from './app.js';
import { EnvSchema, startService } from './configs/index.js';

async function startServer() {
    const app = await buildApp({ logger: false });

    app.listen(
        {
            port: app.getEnvs<EnvSchema>().PORT,
            host: app.getEnvs<EnvSchema>().HOST,
        },
        (err, address) => {
            if (err) {
                console.error(err);
                app.log.error(err);
                process.exit(1);
            }
            console.log(`Server is now listening on ${address}`);

            startService(app);
        }
    );
}

startServer();
