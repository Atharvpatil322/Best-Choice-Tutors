# Backend - Best Choice Tutors

## Overview
Express-based Node.js backend for the Best Choice Tutors online tutoring platform.

## Directory Structure

```
backend/
├── index.js              # Server entry point
├── routes/               # API route definitions
├── controllers/          # Request handlers
├── services/             # Business logic layer
├── models/               # Data models
├── middlewares/          # Custom middleware functions
├── config/               # Configuration files
└── utils/                # Utility functions and helpers
```

## Architecture

- **Routes**: Define API endpoints and map them to controllers
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and data processing
- **Models**: Define data structures and database schemas
- **Middlewares**: Handle cross-cutting concerns (auth, validation, error handling)
- **Config**: Store configuration files (database, environment variables)
- **Utils**: Reusable utility functions

## Development Notes

- This is a structure-only setup. No dependencies or business logic have been added yet.
- Follow RESTful API conventions for route naming
- Keep controllers thin - delegate business logic to services
- Use middleware for authentication, validation, and error handling
