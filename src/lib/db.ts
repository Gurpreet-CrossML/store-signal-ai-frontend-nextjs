"use server";

import { drizzle } from 'drizzle-orm/node-postgres';

// Initialize Drizzle ORM with PostgreSQL connection
export const db = drizzle({
    connection: {
        connectionString: process.env.DATABASE_URL!,
        ssl: true,
    }
});


