import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('https://api.nxfs.no'),
  NEXT_PUBLIC_N8N_URL: z
    .string()
    .url()
    .default('https://n8n.nxfs.no/webhook/nxfs'),
  NEXT_PUBLIC_N8N_SECRET_KEY: z.string().default('dev-unsecure-key-123'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_N8N_URL: process.env.NEXT_PUBLIC_N8N_URL,
  NEXT_PUBLIC_N8N_SECRET_KEY: process.env.NEXT_PUBLIC_N8N_SECRET_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
