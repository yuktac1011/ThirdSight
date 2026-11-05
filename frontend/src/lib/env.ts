import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default('http://localhost:8000/api/v1'),
  VITE_APP_NAME: z.string().default('ThirdSight'),
  MODE: z.string().optional(),
});

export const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  MODE: import.meta.env.MODE,
});

