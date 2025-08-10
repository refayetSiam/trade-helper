import { z } from 'zod';

/**
 * Validation schemas for API endpoints
 */

// Stock symbol validation - strict format for security
export const symbolSchema = z
  .string()
  .min(1, 'Symbol is required')
  .max(10, 'Symbol too long')
  .regex(
    /^[A-Z0-9.-]+$/,
    'Invalid symbol format - only uppercase letters, numbers, dots, and hyphens allowed'
  )
  .transform((s: string) => s.trim().toUpperCase());

// Time range validation
export const timeRangeSchema = z.enum(
  ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '2Y', '5Y', 'MAX'],
  {
    message: 'Invalid time range',
  }
);

// Interval validation
export const intervalSchema = z
  .string()
  .regex(/^(1m|2m|5m|15m|30m|60m|90m|1h|1d|5d|1wk|1mo|3mo)$/, 'Invalid interval format')
  .optional()
  .nullable();

// Positive integer validation
export const positiveIntegerSchema = z
  .string()
  .regex(/^\d+$/, 'Must be a positive integer')
  .transform((s: string) => parseInt(s, 10))
  .refine((n: number) => n > 0 && n <= 1000, 'Value must be between 1 and 1000');

// Chart data request validation
export const chartDataRequestSchema = z.object({
  symbol: symbolSchema,
  range: timeRangeSchema,
  interval: intervalSchema,
});

// Quote request validation
export const quoteRequestSchema = z.object({
  symbol: symbolSchema,
});

// Options request validation
export const optionsRequestSchema = z.object({
  symbol: symbolSchema,
  forceRefresh: z
    .string()
    .optional()
    .transform((s?: string) => s === 'true'),
  maxExpirations: z.string().optional().pipe(positiveIntegerSchema.optional()),
});

// Historical data request validation
export const historicalDataRequestSchema = z.object({
  symbol: symbolSchema,
  range: timeRangeSchema,
  interval: intervalSchema,
});

/**
 * Validate request parameters against schema
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | null>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Convert null values to undefined for optional fields
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== null)
    );

    const result = schema.parse(cleanParams);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid request parameters'] };
  }
}

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // Remove HTML/JS injection chars
    .replace(/[{}]/g, '') // Remove object notation chars
    .replace(/[\r\n]/g, '') // Remove line breaks
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize URL parameters
 */
export function getValidatedParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  const params: Record<string, string | null> = {};

  for (const [key, value] of searchParams.entries()) {
    params[key] = sanitizeInput(value);
  }

  return validateRequest(schema, params);
}
