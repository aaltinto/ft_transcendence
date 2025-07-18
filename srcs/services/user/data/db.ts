import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR: string = "app/data";
const DB_PATH: string = path.join(DATA_DIR, "auth.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = Database(DB_PATH);

function initDB() {
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
	CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE (user_id, friend_id) -- Prevent duplicate friendships
    );
  `);
  console.log("DB created at ", DB_PATH);
}

initDB();

export default db;
