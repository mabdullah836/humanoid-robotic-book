# Database Migrations Guide

This document provides instructions for running database migrations using Drizzle Kit.

## Prerequisites

1. Ensure you have a Neon PostgreSQL database created at [console.neon.tech](https://console.neon.tech)
2. Copy `.env.example` to `.env.local` and fill in your `DATABASE_URL`

```bash
cp .env.example .env.local
```

3. Update `DATABASE_URL` in `.env.local` with your Neon connection string:
```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

## Running Migrations

### Step 1: Generate Migration Files

Generate SQL migration files from your schema changes:

```bash
npx drizzle-kit generate
```

This command:
- Reads the schema from `./lib/db/schema.ts`
- Compares it with the current database state
- Generates SQL migration files in the `./drizzle` directory

### Step 2: Apply Migrations

Apply the generated migrations to your database:

```bash
npx drizzle-kit migrate
```

This command:
- Reads migration files from `./drizzle`
- Applies them to your Neon PostgreSQL database
- Tracks applied migrations in a `__drizzle_migrations` table

## Alternative: Direct Schema Push (Development Only)

For rapid development, you can push schema changes directly without generating migration files:

```bash
npx drizzle-kit push
```

**Warning**: This is not recommended for production as it does not create versioned migration files.

## Drizzle Studio

To visually inspect and manage your database:

```bash
npx drizzle-kit studio
```

This opens a web-based GUI at `https://local.drizzle.studio` for browsing tables and data.

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `npx drizzle-kit generate` | Generate migration files from schema |
| `npx drizzle-kit migrate` | Apply migrations to database |
| `npx drizzle-kit push` | Push schema directly (dev only) |
| `npx drizzle-kit studio` | Open visual database browser |
| `npx drizzle-kit check` | Check for schema inconsistencies |
| `npx drizzle-kit drop` | Drop migration (use with caution) |

## Troubleshooting

### Connection Issues

If you encounter connection errors:

1. Verify your `DATABASE_URL` is correctly formatted
2. Ensure your IP is allowed in Neon's connection settings
3. Check that `sslmode=require` is included in the connection string

### Migration Conflicts

If migrations fail due to conflicts:

1. Check the `./drizzle` directory for conflicting migration files
2. Use `npx drizzle-kit drop` to remove problematic migrations
3. Regenerate migrations with `npx drizzle-kit generate`

### Schema Sync Issues

If your schema is out of sync:

1. Run `npx drizzle-kit push` to force sync (development only)
2. Or create a new migration with `npx drizzle-kit generate`
