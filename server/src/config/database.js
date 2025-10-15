/**
 * Database Connection Singleton
 *
 * Provides a shared Neon database connection for the entire application.
 * This avoids passing sql connections through every function call.
 */

import { neon } from '@neondatabase/serverless';

let sqlInstance = null;

/**
 * Get the shared Neon database connection instance
 * @returns {Function} Neon SQL query function
 */
export function getNeonDatabase() {
  if (!sqlInstance) {
    const neonUrl = process.env.NEON_DATABASE_URL;
    if (!neonUrl) {
      throw new Error('NEON_DATABASE_URL environment variable is required');
    }
    sqlInstance = neon(neonUrl);
    console.log('📊 Neon database connection initialized');
  }
  return sqlInstance;
}

/**
 * Export the sql instance directly for convenience
 */
export const sql = getNeonDatabase();