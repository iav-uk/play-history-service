// src/services/gdprService.ts

import { query } from '../db/pg';

export default class GdprService {
  async deleteUserData(userId: string): Promise<number> {
    // delete all play history for this user
    const deleted = await query('DELETE FROM plays WHERE user_id = $1 RETURNING id', [userId]);

    // record the tombstone
    await query(
      `INSERT INTO gdpr_tombstones (user_id, deleted_at)
       VALUES ($1, now())
       ON CONFLICT (user_id) DO UPDATE SET deleted_at = EXCLUDED.deleted_at`,
      [userId],
    );

    return deleted.rowCount || 0;
  }

  async isUserDeleted(userId: string): Promise<boolean> {
    const result = await query('SELECT 1 FROM gdpr_tombstones WHERE user_id = $1 LIMIT 1', [
      userId,
    ]);
    return (result.rowCount || 0) > 0;
  }
}

export const gdprService = new GdprService();
