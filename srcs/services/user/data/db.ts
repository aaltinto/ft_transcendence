import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR: string = "/app/data";
const DB_PATH: string = path.join(DATA_DIR, "user.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = Database(DB_PATH);

function initDB() {
  // Existing users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT UNIQUE,
      avatar_url TEXT DEFAULT 'static/media/default.jpeg',
      status TEXT DEFAULT 'offline',
      matches_played INTEGER DEFAULT 0,
      matches_won INTEGER DEFAULT 0,
      last_active TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Friends relationship table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
      requested_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    );
  `);

  // Index for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
  `);

  // Trigger to automatically create reciprocal friendship when accepted
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS create_reciprocal_friendship
    AFTER UPDATE ON friendships
    WHEN NEW.status = 'accepted' AND OLD.status = 'pending'
    BEGIN
      INSERT OR IGNORE INTO friendships (user_id, friend_id, status, requested_by, created_at, updated_at)
      VALUES (NEW.friend_id, NEW.user_id, 'accepted', NEW.requested_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END;
  `);
}

export class FriendsService {
  
  // Send friend request
  static sendFriendRequest(userId: number, friendId: number) {
    const stmt = db.prepare(`
      INSERT INTO friendships (user_id, friend_id, status, requested_by)
      VALUES (?, ?, 'pending', ?)
    `);
    return stmt.run(userId, friendId, userId);
  }

  // Accept friend request
  static acceptFriendRequest(userId: number, friendId: number) {
    const stmt = db.prepare(`
      UPDATE friendships 
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `);
    return stmt.run(friendId, userId); // Note: reversed because we're accepting THEIR request
  }

  // Reject/Remove friend
  static removeFriendship(userId: number, friendId: number) {
    const stmt = db.prepare(`
      DELETE FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `);
    return stmt.run(userId, friendId, friendId, userId);
  }

  // Get all friends (accepted only)
  static getFriends(userId: number) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.status, u.last_active
      FROM users u
      INNER JOIN friendships f ON (
        (f.user_id = ? AND f.friend_id = u.id) OR 
        (f.friend_id = ? AND f.user_id = u.id)
      )
      WHERE f.status = 'accepted' AND u.id != ?
      ORDER BY u.display_name
    `);
    return stmt.all(userId, userId, userId);
  }

  // Get pending friend requests (received)
  static getPendingRequests(userId: number) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, f.created_at
      FROM users u
      INNER JOIN friendships f ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `);
    return stmt.all(userId);
  }

  // Get sent friend requests (pending)
  static getSentRequests(userId: number) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, f.created_at
      FROM users u
      INNER JOIN friendships f ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `);
    return stmt.all(userId);
  }

  // Check friendship status between two users
  static getFriendshipStatus(userId: number, friendId: number) {
    const stmt = db.prepare(`
      SELECT status, requested_by, created_at
      FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      LIMIT 1
    `);
    return stmt.get(userId, friendId, friendId, userId) as {status: string, requested_by: number, created_at: Date} | null;
  }

  // Block user
  static blockUser(userId: number, blockedUserId: number) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO friendships (user_id, friend_id, status, requested_by, updated_at)
      VALUES (?, ?, 'blocked', ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(userId, blockedUserId, userId);
  }

  // Get friends count
  static getFriendsCount(userId: number) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM friendships 
      WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
    `);
    const result = stmt.get(userId, userId) as { count: number };
    return Math.floor(result.count / 2); // Divide by 2 because relationships are stored twice
  }
}

initDB();

export default db;
