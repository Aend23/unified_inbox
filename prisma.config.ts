import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: 'postgresql://postgres:ankush@23@localhost:5432/unified_inbox?schema=public',
  },
});
