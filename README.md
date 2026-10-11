# 🦊 Elysia Backend Starter Kit

A production-ready, high-performance, and type-safe REST API starter kit built with **ElysiaJS**, **Bun**, **Drizzle ORM**, and **MySQL**, organized using **Clean Architecture** principles.

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)
![ElysiaJS](https://img.shields.io/badge/ElysiaJS-black?style=flat&logo=elysia&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=flat&logo=drizzle&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?style=flat&logo=biome&logoColor=white)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Tech Stacks](#tech-stacks)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [How to Install (Local Development)](#how-to-install-local-development)
- [How to Install (Docker)](#how-to-install-docker)
- [Available Scripts](#available-scripts)
- [API Endpoints Overview](#api-endpoints-overview)
- [Environment Variables](#environment-variables)
- [Contributing & License](#contributing--license)

---

## Overview

This starter kit provides an enterprise-ready foundation for scalable backend services. It combines Bun's blazing-fast execution with ElysiaJS's ergonomic type safety, Drizzle's zero-overhead ORM, and Clean Architecture for clean domain boundary separation and maintainability.

---

## 🛠 Tech Stacks

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime & Tooling** | [Bun](https://bun.sh/) | All-in-one JavaScript/TypeScript runtime, bundler, and package manager |
| **Web Framework** | [ElysiaJS](https://elysiajs.com/) | Ergonomic, type-safe, and ultra-fast web framework designed for Bun |
| **Database** | [MySQL 8+](https://www.mysql.com/) | Robust, relational database management system (You can change easily another database as like postgresql, supabase, etc.) |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) | Headless, type-safe TypeScript ORM with schema migrations and code-gen |
| **Authentication** | [@elysiajs/jwt](https://elysiajs.com/plugins/jwt.html) & [@elysiajs/bearer](https://elysiajs.com/plugins/bearer.html) | Dual JWT (Access & Refresh tokens) with Bearer token authentication |
| **Validation** | [TypeBox](https://github.com/sinclairzx81/typebox) | High-performance JSON Schema Type Builder built natively into Elysia |
| **API Documentation** | [@elysiajs/swagger](https://elysiajs.com/plugins/swagger.html) | Automated OpenAPI / Swagger documentation with live Bearer Auth testing |
| **Structured Logging** | [Pino](https://github.com/pinojs/pino) & [Logixlysia](https://github.com/unnoq/logixlysia) | File-based daily rotated logging (`storage/logs/app.log`) and HTTP request telemetry |
| **Linter & Formatter** | [Biome](https://biomejs.dev/) | Ultra-fast toolchain for formatting and linting code |
| **Containerization** | [Docker](https://www.docker.com/) | Multi-stage Bun compile build paired with Google Distroless runtime image |

---

## ✨ Features

- **🏛️ Clean Architecture**: Strict separation of concerns divided into Domain Entities, Repositories, Use Cases, Presenters, and HTTP Handlers.
- **🔐 JWT Authentication & RBAC**:
  - Secure user registration and password hashing using Bun's native cryptographic functions.
  - Dual-token workflow (short-lived Access Token & long-lived Refresh Token). 
  - Self-service endpoints for profile retrieval (`/auth/me`) and session termination (`/auth/logout`).
- **👥 User Management Module**:
  - CRUD operations with pagination, sorting, and field-level updates.
  - Role-protected endpoints (e.g., delete user restricted to `SUPER_ADMIN`).
- **🚀 Multi-Core Cluster Mode**:
  - Automatically forks worker processes to utilize all available CPU cores using Node's `cluster` module for maximum throughput.
- **📚 Interactive Swagger UI**:
  - Out-of-the-box OpenAPI documentation accessible at `/swagger` with interactive JWT authentication pre-configured.
- **🪵 Advanced Logging & Observability**:
  - HTTP request/response metrics (latency, status code, route) via `Logixlysia`.
  - Application logging with scoped loggers via `Pino`, writing both to stdout (pretty-printed in dev) and daily-rotating file logs (`storage/logs/app.log`).
- **🛠️ Automated Database Migration Scripts**:
  - Drizzle Kit migration pipeline enriched with automatic SQL schema comment injections.
- **⚠️ Centralized Error Handling**:
  - Unified error response payload for validation failures, authentication/authorization issues, and unexpected errors.

---

## 📂 Project Architecture

```text
├── drizzle/                      # Generated SQL migration files
├── scripts/                      # Utility scripts (e.g., add SQL comments)
├── storage/                      # App storage (logs, temp uploads)
│   └── logs/                     # Daily rotated application log files
├── src/
│   ├── common/                   # Shared cross-cutting modules
│   │   ├── enums/                # Role and global enums
│   │   ├── errors/               # Custom AppError classes & global error handler
│   │   ├── logger/               # Scoped logger exports
│   │   └── middleware/           # Auth & RBAC guards
│   ├── config/                   # Logger and server configuration
│   ├── db/                       # Drizzle schema definitions and DB client
│   │   ├── index.ts              # MySQL connection pool initialization
│   │   └── schema.ts             # Database tables schema
│   ├── internal/                 # Clean Architecture layers
│   │   ├── entity/               # Domain entities & TypeBox validation schemas
│   │   ├── http/                 # Route handlers (Controllers)
│   │   │   └── handler/          # Auth & User HTTP endpoints
│   │   ├── presenter/            # Standardized JSON response formatters
│   │   ├── repository/           # Data access layer (MySQL / Drizzle)
│   │   └── usecase/              # Application business logic
│   ├── index.ts                  # Cluster master & worker entrypoint
│   └── server.ts                 # Elysia server bootstrap & plugin registration
├── Dockerfile                    # Multi-stage production container build
├── biome.json                    # Biome linting & formatting configuration
├── drizzle.config.ts             # Drizzle Kit configuration
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 📋 Prerequisites

Before getting started, make sure you have the following installed:

- **[Bun](https://bun.sh/)** (`>= 1.1.0`)
- **[MySQL](https://www.mysql.com/)** (`>= 8.0`) or Docker
- **[Git](https://git-scm.com/)**

---

## 🚀 How to Install (Local Development)

### 1. Clone the Repository

```bash
git clone https://github.com/rahmatrdn/elysia-backend-starter-kit.git
cd elysia-backend-starter-kit
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Setup Environment Variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
```

Update your `.env` file:

```env
APP_NAME="starter-kit-server-api"
APP_PORT="3010"
NODE_ENV="local"

# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/elysia_starter_kit_api"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-access-token-key"
JWT_ACCESS_EXP="1h"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-token-key"
JWT_REFRESH_EXP="2d"
```

### 4. Create the MySQL Database

Ensure your MySQL service is running, then create the database specified in your `DATABASE_URL`:

```sql
CREATE DATABASE elysia_starter_kit_api;
```

### 5. Run Database Migrations

Generate and execute Drizzle migrations against your database:

```bash
# Generate SQL migrations and apply them
bun run db:all

# Alternatively, apply migrations directly:
bun run db:migrate
```

### 6. Start the Development Server

```bash
bun run dev
```

Your server will spin up workers across your CPU cores. The service is accessible at:
- **API Base URL**: `http://localhost:3010`
- **Swagger Documentation**: `http://localhost:3010/swagger`

---

## 🐳 How to Install (Docker)

You can run the application using either **Docker standalone** or **Docker Compose** (including a MySQL database).

### Option 1: Standalone Docker Container

#### 1. Build the Docker Image

The multi-stage `Dockerfile` compiles the Bun TypeScript source into an optimized standalone binary running on Google Distroless:

```bash
docker build -t elysia-starter-kit-api .
```

#### 2. Run the Container

Run the image and supply your environment variables:

```bash
docker run -d \
  --name elysia-backend-app \
  -p 3010:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mysql://root:password@host.docker.internal:3306/elysia_starter_kit_api" \
  -e JWT_SECRET="your-jwt-access-secret" \
  -e JWT_REFRESH_SECRET="your-jwt-refresh-secret" \
  elysia-starter-kit-api
```

---

### Option 2: Docker Compose (App + MySQL Database)

You can spin up both the Elysia API and MySQL database together with Docker Compose.

#### 1. Create a `docker-compose.yml` File

Create a `docker-compose.yml` file in the root directory:

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: elysia-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: elysia_starter_kit_api
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 5s
      retries: 10

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: elysia-api
    restart: always
    ports:
      - "3010:3000"
    environment:
      PORT: 3000
      APP_NAME: "starter-kit-server-api"
      NODE_ENV: "production"
      DATABASE_URL: "mysql://root:rootpassword@mysql:3306/elysia_starter_kit_api"
      JWT_SECRET: "your-super-secret-jwt-access-token-key"
      JWT_ACCESS_EXP: "1h"
      JWT_REFRESH_SECRET: "your-super-secret-jwt-refresh-token-key"
      JWT_REFRESH_EXP: "2d"
    depends_on:
      mysql:
        condition: service_healthy

volumes:
  mysql_data:
```

#### 2. Start the Services

```bash
docker compose up -d --build
```

#### 3. Run Database Migrations in the Containerized Setup

Before making API requests, run migrations against the MySQL container:

```bash
# From your host machine:
DATABASE_URL="mysql://root:rootpassword@localhost:3306/elysia_starter_kit_api" bun run db:migrate
```

#### 4. Access the Services

- **API Endpoint**: `http://localhost:3010`
- **Swagger Documentation**: `http://localhost:3010/swagger`

To view logs:
```bash
docker compose logs -f api
```

To stop all services:
```bash
docker compose down
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `bun run dev` | Starts the server in development mode with hot-reloading (`--watch`) |
| `bun run lint` | Runs Biome linter across the project |
| `bun run lint:fix` | Runs Biome linter and automatically applies safe fixes |
| `bun run format` | Formats all files according to Biome configuration |
| `bun run db:generate` | Generates Drizzle migration files and inserts schema comments |
| `bun run db:comment` | Runs utility script to append column comments to generated SQL migrations |
| `bun run db:migrate` | Applies pending Drizzle migrations to the database |
| `bun run db:all` | Generates migrations with comments and applies them sequentially |
| `bun run db:push` | Pushes schema changes directly to the database without generating migration files |

---

## 🚦 API Endpoints Overview

### Public & Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Health check endpoint | No |
| `GET` | `/swagger` | Swagger OpenAPI UI | No |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Authenticate user and obtain tokens | No |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token | No |
| `POST` | `/auth/logout` | Invalidate current user session | Bearer JWT |
| `GET` | `/auth/me` | Fetch authenticated user's profile | Bearer JWT |

### Internal & User Management Endpoints

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `/internal/users` | Create a new user | `SUPER_ADMIN`, `ADMIN` |
| `GET` | `/internal/users` | List paginated users with filters | `SUPER_ADMIN`, `ADMIN` |
| `GET` | `/internal/users/:id` | Get user details by ID | `SUPER_ADMIN`, `ADMIN`, or Self |
| `PUT` | `/internal/users/:id` | Update user details by ID | `SUPER_ADMIN`, `ADMIN`, or Self |
| `DELETE`| `/internal/users/:id` | Delete user account by ID | `SUPER_ADMIN` only |

---

## ⚙️ Environment Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | string | `starter-kit-server-api` | Name of the application |
| `APP_PORT` / `PORT` | number | `3010` | Port on which the HTTP server listens |
| `NODE_ENV` | string | `local` | Environment mode (`local`, `development`, `production`) |
| `DATABASE_URL` | string | - | MySQL connection string (`mysql://user:pass@host:port/db`) |
| `JWT_SECRET` | string | - | Secret key used to sign and verify JWT Access Tokens |
| `JWT_ACCESS_EXP` | string | `1h` | Expiration time for Access Tokens |
| `JWT_REFRESH_SECRET` | string | - | Secret key used to sign and verify JWT Refresh Tokens |
| `JWT_REFRESH_EXP` | string | `2d` | Expiration time for Refresh Tokens |

---

## 📄 Contributing & License

Contributions, issues, and feature requests are welcome! Feel free to open an issue or pull request.

Distributed under the [MIT](LICENSE) License.