import prompts from 'prompts';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

if (!fs.existsSync(SRC)) {
    throw new Error('❌ src/ not found');
}

/**
 * =========================
 * UTILS
 * =========================
 */

const toPascal = s =>
    s.replace(/(^\w|-\w)/g, m => m.replace('-', '').toUpperCase());

const toCamel = s => {
    const p = toPascal(s);
    return p[0].toLowerCase() + p.slice(1);
};

const ensureFile = (file, content) => {
    if (fs.existsSync(file)) return false;
    fs.writeFileSync(file, content.trimStart());
    console.log(`✅ Created: ${file}`);
    return true;
};

const appendExport = (indexPath, line) => {
    let content = fs.existsSync(indexPath)
        ? fs.readFileSync(indexPath, 'utf8')
        : '';

    if (content.includes(line)) return;

    const prefix = content && !content.endsWith('\n') ? '\n' : '';
    fs.appendFileSync(indexPath, `${prefix}${line}\n`);
};

const appendToBlock = (file, code) => {
    const content = fs.readFileSync(file, 'utf8');
    const i = content.lastIndexOf('}');
    fs.writeFileSync(file, content.slice(0, i) + code + '\n}');
};

const extractParams = url =>
    (url.match(/:([a-zA-Z0-9_]+)/g) || []).map(v => v.slice(1));

/**
 * =========================
 * INPUT
 * =========================
 */

const { method } = await prompts({
    type: 'select',
    name: 'method',
    message: 'HTTP method',
    choices: [
        { title: 'GET', value: 'get' },
        { title: 'POST', value: 'post' },
        { title: 'PUT', value: 'put' },
        { title: 'DELETE', value: 'delete' },
        { title: 'PATCH', value: 'patch' }
    ]
});

if (!method) process.exit(0);

const methodValue = typeof method === 'string' ? method : method?.value;

const { url } = await prompts({
    type: 'text',
    name: 'url',
    message: 'Full API path (/api/example/create-stuff)',
    validate: v => v.startsWith('/api/') || 'Must start with /api/'
});

const { handler } = await prompts({
    type: 'text',
    name: 'handler',
    message: 'Controller method name (e.g. createStuff)'
});

if (!url || !handler) process.exit(0);

/**
 * =========================
 * DERIVE
 * =========================
 */

const parts = url.split('/');
const moduleName = parts[2];

if (!moduleName) {
    console.log('❌ Invalid path');
    process.exit(0);
}

const modulePascal = toPascal(moduleName);
const moduleCamel = toCamel(moduleName);

const handlerPascal = toPascal(handler);

const schemaName = `${handlerPascal}Schema`;
const typeName = `${handlerPascal}Type`;

const paramSchemaName = `${handlerPascal}ParamSchema`;
const paramTypeName = `${handlerPascal}ParamType`;

const params = extractParams(url);

/**
 * Paths
 */
const routeFile = path.join(SRC, 'routes', `${moduleName}.route.ts`);
const controllerFile = path.join(SRC, 'controllers', `${moduleName}.controller.ts`);
const schemaFile = path.join(SRC, 'schemas', `${moduleName}.schema.ts`);

const routeIndex = path.join(SRC, 'routes', 'index.ts');
const controllerIndex = path.join(SRC, 'controllers', 'index.ts');
const schemaIndex = path.join(SRC, 'schemas', 'index.ts');

/**
 * =========================
 * AUTO CREATE BASE FILES
 * =========================
 */

const isNew = !fs.existsSync(routeFile);

if (isNew) {
    console.log('🆕 Creating new API module...');
} else {
    console.log('✏️ Updating existing API module...');
}

ensureFile(schemaFile, `
import { Static, Type } from '@fastify/type-provider-typebox';
`);

ensureFile(controllerFile, `
import { FastifyReply, FastifyRequest } from 'fastify';

export class ${modulePascal}Controller {}
`);

ensureFile(routeFile, `
import { FastifyInstance } from 'fastify';
import { ${modulePascal}Controller } from '../controllers/index.js';

export async function ${moduleCamel}Routes(fastify: FastifyInstance) {
    const controller = new ${modulePascal}Controller();
}
`);

appendExport(schemaIndex, `export * from './${moduleName}.schema.js';`);
appendExport(controllerIndex, `export * from './${moduleName}.controller.js';`);
appendExport(routeIndex, `export * from './${moduleName}.route.js';`);

/**
 * =========================
 * SCHEMA
 * =========================
 */

if (!fs.existsSync(schemaFile)) {
    console.log('❌ Schema file missing');
    process.exit(0);
}

let schemaCode = `
export const ${schemaName} = Type.Object({});
export type ${typeName} = Static<typeof ${schemaName}>;
`;

if (params.length) {
    schemaCode += `
export const ${paramSchemaName} = Type.Object({
    ${params.map(p => `${p}: Type.String()`).join(',')}
});
export type ${paramTypeName} = Static<typeof ${paramSchemaName}>;
`;
}

const schemaContent = fs.readFileSync(schemaFile, 'utf8');

if (!schemaContent.includes(schemaName)) {
    fs.appendFileSync(schemaFile, schemaCode);
    console.log('📦 Schema added');
}

/**
 * =========================
 * ROUTE
 * =========================
 */

let routeContent = fs.readFileSync(routeFile, 'utf8');

if (!routeContent.includes(schemaName)) {
    const importLine = `import { ${schemaName}${params.length ? `, ${paramSchemaName}` : ''} } from '../schemas/index.js';\n`;
    routeContent = importLine + routeContent;
    fs.writeFileSync(routeFile, routeContent);
}

appendToBlock(routeFile, `
    fastify.${methodValue}('${url}', {
        schema: {
            ${['post', 'put', 'patch'].includes(methodValue) ? `body: ${schemaName},` : `querystring: ${schemaName},`}
            ${params.length ? `params: ${paramSchemaName},` : ''}
        }
    }, controller.${handler}.bind(controller));
`);

console.log('🧩 Route added');

/**
 * =========================
 * CONTROLLER
 * =========================
 */

let controllerContent = fs.readFileSync(controllerFile, 'utf8');

if (!controllerContent.includes(typeName)) {
    const importLine = `import { ${typeName}${params.length ? `, ${paramTypeName}` : ''} } from '../schemas/index.js';\n`;
    controllerContent = importLine + controllerContent;
    fs.writeFileSync(controllerFile, controllerContent);
}

const typeKey =
    methodValue === 'get' || methodValue === 'delete'
        ? 'Querystring'
        : 'Body';

if (!controllerContent.includes(`async ${handler}(`)) {
    appendToBlock(controllerFile, `
    async ${handler}(
        request: FastifyRequest<{
            ${typeKey}: ${typeName}
            ${params.length ? `; Params: ${paramTypeName}` : ''}
        }>,
        reply: FastifyReply
    ) {
        return { success: true };
    }
`);
    console.log('🧠 Controller updated');
}

/**
 * =========================
 * DONE
 * =========================
 */

console.log(`\n🚀 ${methodValue.toUpperCase()} ${url} ready`);