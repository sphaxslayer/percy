/**
 * utils.ts — Utility functions for shadcn-vue components.
 * cn() merges Tailwind classes intelligently (handles conflicts like "p-2 p-4" → "p-4").
 * This is required by all shadcn-vue components.
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
