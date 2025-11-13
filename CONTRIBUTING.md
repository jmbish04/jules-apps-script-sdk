# Contributing to JulesApp SDK

Thank you for your interest in contributing! This guide will help you set up your development environment.

## Prerequisites

- Node.js (LTS recommended)
- npm
- [clasp](https://github.com/google/clasp) (installed locally via devDependencies, but useful to have globally)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/davideast/jules-app-script-sdk.git
   cd jules-app-script-sdk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Building
This project uses `esbuild` to bundle the TypeScript source into a single file compatible with Apps Script.

To build once:
```bash
npm run build
```

To watch for changes and rebuild automatically:
```bash
npm run watch
```

### Testing
We use [Vitest](https://vitest.dev/) for testing.

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Deployment

To push changes to the Google Apps Script project, use the following command. This will build the project first.

```bash
npm run push
```

**Note**: You must be logged in with clasp (`npx clasp login`) and have the correct `.clasp.json` file configured.
