# Warehouse Management System (Almoxarifado)

## Overview

This is a full-stack warehouse management system built with React, Express, and PostgreSQL. The application provides comprehensive inventory management capabilities including material tracking, stock entry/exit operations, user authentication, and reporting features. The system is designed with multi-tenant architecture supporting role-based access control.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Database ORM**: Drizzle ORM with Neon serverless PostgreSQL
- **API Design**: RESTful endpoints with proper error handling

### Database Design
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Multi-tenancy**: Owner-based data isolation using `ownerId` field
- **Core Entities**: Users, Categories, Suppliers, Employees, Materials, Stock Entries/Exits

## Key Components

### Authentication System
- Session-based authentication with secure password hashing (scrypt)
- Role-based access control (user, admin, super_admin)
- Protected routes with automatic redirection
- Multi-tenant user isolation

### Inventory Management
- **Materials**: Core inventory items with category classification
- **Stock Tracking**: Real-time stock levels with minimum stock alerts
- **Entry/Exit Operations**: Comprehensive tracking of material movements
- **Categories**: Hierarchical organization of materials
- **Suppliers & Employees**: Entity management for tracking relationships

### User Interface
- **Dashboard**: Real-time metrics and stock alerts
- **Material Entry**: Form-based stock entry with supplier tracking
- **Material Exit**: Stock withdrawal with employee assignment
- **Registration System**: Multi-entity CRUD operations (materials, categories, etc.)
- **Reports**: Financial and operational reporting
- **Responsive Design**: Mobile-friendly interface with dark mode support

## Data Flow

1. **Authentication Flow**: User credentials → Passport.js → Session creation → User context
2. **Inventory Operations**: Form submission → Validation → Database transaction → Cache invalidation → UI update
3. **Real-time Updates**: Database changes → TanStack Query cache invalidation → Automatic UI refresh
4. **Multi-tenant Data**: All operations filtered by user's `ownerId` for data isolation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: TypeScript ORM with excellent type safety
- **@tanstack/react-query**: Server state management and caching
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form handling with validation
- **zod**: Schema validation

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundler for production server build
- **vite**: Frontend build tool and dev server

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reload
- **Database**: Neon PostgreSQL with WebSocket connections
- **Port Configuration**: Frontend (5000), Backend integrated

### Production Build
- **Frontend**: Vite production build with asset optimization
- **Backend**: esbuild bundling for Node.js deployment
- **Static Assets**: Served from dist/public directory
- **Database**: Neon serverless PostgreSQL with connection pooling

### Replit Configuration
- **Modules**: Node.js 20, Web, PostgreSQL 16
- **Auto-deployment**: Configured for autoscale deployment
- **Environment**: SESSION_SECRET and DATABASE_URL required
- **Build Process**: npm run build → npm run start

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```