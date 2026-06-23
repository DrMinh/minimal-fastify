## Requirements

* Node.js >= 23.0
* MongoDB

## Setup & Deployment

```bash
cp .env.dev .env      # Copy environment template to active config
npm install           # Install dependencies
npm run migrate       # Run database migrations
npm start             # Start the server
# or
npm run dev           # Start the server in development mode
```

## Documentation

* [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
* [Coding Guidelines](./docs/CODING_GUIDELINES.md)