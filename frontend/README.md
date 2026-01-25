# Frontend - Best Choice Tutors

## Overview
React + Vite frontend application for the Best Choice Tutors online tutoring platform.

## Directory Structure

```
frontend/
├── pages/                # Page components (route-level components)
├── components/           # Reusable UI components
├── services/             # API service functions
├── hooks/                # Custom React hooks
├── layouts/              # Layout components
├── routes/               # Route configuration
└── assets/               # Static assets (images, fonts, etc.)
```

## Architecture

- **Pages**: Top-level components that represent different routes/views
- **Components**: Reusable UI components used across the application
- **Services**: Functions for API calls and external service integration
- **Hooks**: Custom React hooks for shared logic and state management
- **Layouts**: Wrapper components that define page structure (headers, footers, sidebars)
- **Routes**: Route definitions and navigation configuration
- **Assets**: Static files like images, icons, fonts, and other media

## Development Notes

- This is a structure-only setup. No dependencies or components have been added yet.
- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks
- Organize components by feature when the project grows
