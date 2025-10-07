// src/models/types.ts

import { z } from 'zod';

// [DEV NOTE] supports v4 UUID like 11111111-1111-1111-1111-111111111111, where the 13th hex digit is 4 and the 17th is 8–b 11111111-1111-4111-8111-111111111111
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// [DEV NOTE] to match any UUID, replace above
// const uuidRegex =
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// validator for UUID
export const UUIDSchema = z.string().regex(uuidRegex, { message: 'Invalid UUID format' });

// validator for GDRP
export const UserIdSchema = z.object({
  userId: z.string().regex(uuidRegex, {
    message: 'Invalid UUID format',
  }),
});

// validator for play event
export const PlayEventSchema = z.object({
  eventId: UUIDSchema,
  userId: UUIDSchema,
  contentId: UUIDSchema,
  device: z.string().min(1, { message: 'Device name must not be empty' }),
  playbackDuration: z.number().positive({ message: 'Playback duration must be greater than 0' }),
  playedAt: z
    .string()
    .refine((val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(val), {
      message: 'playedAt must be an ISO 8601 UTC timestamp (e.g. 2025-10-06T10:00:00Z)',
    })
    .transform((val) => new Date(val)),
  // [DEV NOTE] to change app to accept any date outside of ISO 8601 UTC format, specifically RFC 2822 date string, replace above. both "2025-10-06T10:00:00Z" and "2025-10-06 10:00:00" will pass.
  // playedAt: z.string().refine(
  //     (val) => !isNaN(Date.parse(val)),
  //     { message: "Invalid date format" }
  // ),
});

// pagination validator
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

// validator for history route
export const HistoryParamsSchema = z.object({
  userId: UUIDSchema,
  ...PaginationSchema.shape, // merge shared fields
});

// validator for date range
export const DateRangeSchema = z
  .object({
    from: z.string().refine((v) => !isNaN(Date.parse(v)), {
      message: "Invalid 'from' date format",
    }),
    to: z.string().refine((v) => !isNaN(Date.parse(v)), {
      message: "Invalid 'to' date format",
    }),
  })
  .refine((data) => new Date(data.from).getTime() < new Date(data.to).getTime(), {
    message: "'from' must be earlier than 'to'",
  });

export type PlayEvent = z.infer<typeof PlayEventSchema>;
