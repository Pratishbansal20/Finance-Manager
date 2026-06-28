import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 reads connection config from here (not from the schema's datasource).
// The CLI uses this URL for `migrate`, `db push`, and introspection; the runtime
// client connects via the pg driver adapter in src/lib/db/prisma.ts.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
});
