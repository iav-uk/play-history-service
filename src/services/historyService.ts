// src/services/historyService.ts

import { query } from '../db/pg';

export class HistoryService {
  async getHistory(userId: string, limit = 20, offset = 0) {
    const totalResult = await query('SELECT COUNT(*) FROM plays WHERE user_id=$1', [userId]); // support pagination, total count
    const total = parseInt(totalResult.rows[0].count, 10);

    const res = await query(
      `
        SELECT content_id, device, playback_duration, played_at
        FROM plays
        WHERE user_id = $1
        ORDER BY played_at DESC
        LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset],
    );

    // convert Postgres DB default return from snake_case to expected camelCase
    const items = res.rows.map((row) => ({
      contentId: row.content_id,
      device: row.device,
      playbackDuration: row.playback_duration,
      playedAt: row.played_at,
    }));

    return { total, items };
  }
}

export const historyService = new HistoryService();
