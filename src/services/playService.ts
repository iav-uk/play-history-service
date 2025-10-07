// src/services/playService.ts

import { query } from '../db/pg';
import { PlayEvent } from '../models/types';

export class PlayService {
  async addPlay(event: PlayEvent): Promise<{ inserted: boolean }> {
    // "ON CONFLICT (event_id) DO NOTHING" silently ignores duplicates, user message for duplicate entry returned in play.ts
    const sql = `
      INSERT INTO plays (event_id, user_id, content_id, device, playback_duration, played_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (event_id) DO NOTHING
    `;

    const result = await query(sql, [
      event.eventId,
      event.userId,
      event.contentId,
      event.device,
      event.playbackDuration,
      event.playedAt,
    ]);

    return { inserted: (result.rowCount || 0) > 0 }; // if RETURNING returns no rows, it was a duplicate
  }
}

export const playService = new PlayService();
