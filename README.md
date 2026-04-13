# 🚀 Backend API (NestJS + PostgreSQL + Redis)

A backend application built with NestJS featuring authentication, PostgreSQL database, Redis caching, and Docker-based infrastructure.

---

## 🧱 Tech Stack

- NestJS (Node.js framework)
- PostgreSQL (Docker)
- TypeORM
- Redis (Docker)
- Adminer (DB UI)
- RedisInsight (Redis UI)
- JWT Authentication
- bcrypt password hashing
- Docker Compose

---

## 📦 Project Setup

### 1. Install dependencies

```bash
npm install
```
---
## .env file for development
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=myapp
DB_SYNC=true
NODE_ENV=development
PORT=3000

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET="5996e362-8ea6-41a7-bfcb-5b7d24308642"
JWT_REFRESH_SECRET="7305c2fe-460d-4b37-80c9-61b72433b0d9"

JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

OPENAI_API_KEY=YOUR_KEY
```