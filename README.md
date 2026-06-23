# Fastify Scalable Starter

Fastify is an amazing framework, but it doesn't enforce any project structure. Developers are free to organize their code however they like, which can be great but also overwhelming when starting a new project.

This repository provides a clean and scalable architecture for medium sized Fastify backends, following a simple flow:

`Routes → Controllers → Services`

It gives you a solid foundation right from the start, making your codebase easier to maintain and grow over time.

If you're building a Fastify backend and haven't decided on a folder structure yet, this project is a great place to start.

## Work with AI
This architecture is also designed to work seamlessly with AI coding agents such as Claude and Copilot. A clean and intuitive folder structure helps AI understand the codebase faster, resulting in fewer unintended changes and quicker development iterations.

## Requirements

- Node.js >= 23.0
- MongoDB

## Setup & Deployment

```bash
cp .env.dev .env      # Copy environment template
npm install           # Install dependencies
npm run migrate       # Run database migrations
npm start             # Start the server

# Development mode
npm run dev
```

## Documentation

* [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
* [Coding Guidelines](./docs/CODING_GUIDELINES.md)