# Agent Guidelines for This Project

## Project Overview

This is a simple Express.js static file server. The application serves static files from the `public/` directory and has basic routes for HTML pages.

## Build and Development Commands

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server (`node server.js`) |
| `npm run dev` | Start the development server with hot reload using nodemon |

### Running Tests

**No test framework is currently configured.** To add testing:

```bash
# Install Jest for testing
npm install --save-dev jest

# Add to package.json scripts:
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"

# Run a single test file
npm test -- server.test.js

# Run a specific test
npm test -- --testNamePattern="test name"
```

### Linting

**No linting is currently configured.** To add ESLint:

```bash
# Install ESLint
npm install --save-dev eslint

# Initialize ESLint config
npx eslint --init

# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Type Checking

**No TypeScript is currently in use.** If adding TypeScript:

```bash
# Install TypeScript
npm install --save-dev typescript @types/node @types/express

# Add to package.json:
"typecheck": "tsc --noEmit"

# Run type checking
npm run typecheck
```

## Code Style Guidelines

### General Principles

- Use clear, descriptive names for variables and functions
- Keep functions small and focused (single responsibility)
- Write comments only when necessary to explain complex logic
- Follow the existing code style in the project

### JavaScript Version

- Use ES6+ syntax (const/let, arrow functions, template literals)
- Avoid var; use const by default, let when mutation is needed

### Import Conventions

```javascript
// Node.js built-in modules first
const express = require('express');
const path = require('path');

// Then external dependencies
const someModule = require('some-package');

// Then local modules (relative paths)
// const myModule = require('./modules/myModule');
```

### Formatting

- Use 4 spaces for indentation
- Maximum line length: 100 characters (soft guideline)
- Add trailing commas where appropriate
- Use semicolons consistently
- One blank line between import groups and code

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_PORT` |
| Functions | camelCase, verb prefix | `getUser()`, `calculateTotal()` |
| Classes | PascalCase | `UserController`, `AuthMiddleware` |
| Files | kebab-case | `user-controller.js`, `auth-middleware.js` |
| HTML/CSS | kebab-case | `index.html`, `main-styles.css` |

### Error Handling

- Always handle async errors with try/catch or .catch()
- Use meaningful error messages
- Return appropriate HTTP status codes in Express routes
- Log errors for debugging but avoid exposing sensitive info

```javascript
// Good async error handling in Express
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Express Routes

- Define routes clearly at the top of the file or in separate route files
- Use middleware for cross-cutting concerns (logging, auth, etc.)
- Keep route handlers focused on request/response
- Extract business logic to separate service functions

```javascript
// Preferred route structure
app.get('/users', validateRequest, getUsers);
app.post('/users', validateRequest, createUser);
```

### File Structure

```
project-root/
├── public/              # Static assets (HTML, CSS, JS, images)
│   ├── index.html
│   └── ...
├── server.js            # Main application entry point
├── package.json         # Project dependencies and scripts
└── README.md            # Project documentation
```

### Dependencies

- Keep dependencies minimal
- Use `--save` for production dependencies, `--save-dev` for development
- Run `npm audit fix` regularly to check for vulnerabilities

### Git Conventions

- Write clear, descriptive commit messages
- Use present tense: "Add feature" not "Added feature"
- Reference issue numbers when applicable

### Security Best Practices

- Never commit secrets (API keys, passwords) to version control
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Use Helmet.js middleware for security headers in production
- Implement CORS properly for API endpoints

### Performance Considerations

- Serve static files with proper caching headers
- Use compression (gzip) for production
- Implement rate limiting to prevent abuse
- Close database connections and file handles

### Documentation

- Update README.md when adding new features
- Comment complex business logic
- Document API endpoints with input/output specifications

## Adding New Features

When adding new functionality:

1. **Backend changes**: Add routes in `server.js` or create modular route files
2. **Frontend changes**: Add static files to the `public/` directory
3. **New dependencies**: Run `npm install <package>` and update this file
4. **Testing**: Add tests in a `__tests__/` or `tests/` directory

## Working with This Project

1. Clone the repository
2. Run `npm install` to install dependencies
3. Use `npm run dev` for development with hot reload
4. Test changes manually by visiting `http://localhost`
5. Check for vulnerabilities with `npm audit`
