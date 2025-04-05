import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Create a database connection using the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL!;
// For server-side use, not edge functions
const client = postgres(connectionString);
export const db = drizzle(client, { schema });