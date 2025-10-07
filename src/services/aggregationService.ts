// src/services/aggregationService.ts

import { query } from '../db/pg';

export class AggregationService {
  async getMostWatched(from: string, to: string) {
    const sql = `
      SELECT
        content_id,
        COUNT(*)::int AS total_plays,
        SUM(playback_duration)::int AS total_duration
      FROM plays
      WHERE played_at >= $1 AND played_at < $2
      GROUP BY content_id
      ORDER BY total_plays DESC, total_duration DESC
      LIMIT 50;
    `;
    const result = await query(sql, [from, to]);

    const items = result.rows.map((r) => ({
      contentId: r.content_id,
      totalPlays: r.total_plays,
      totalDuration: r.total_duration,
    }));

    return items || []; // returns empty array if no items were found
  }
}

export const aggregationService = new AggregationService();
