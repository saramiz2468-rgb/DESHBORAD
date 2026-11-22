import { z } from 'zod';

/**
 * Public environment, validated once. Stage 1 has no secrets.
 * Server-only secrets (stage 2+) will live in a separate `env.server.ts` guarded by `server-only`.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_ENABLE_SW_IN_DEV: z.enum(['true', 'false']).optional(),
});

export const publicEnv = schema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_ENABLE_SW_IN_DEV: process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV || undefined,
});
