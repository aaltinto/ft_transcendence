import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = '/app/data';
const DB_PATH = path.join(DATA_DIR, 'user.db');

if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

function initDb() {
	db.exec(`
	CREATE TABLE IF NOT EXISTS users (
  	  id INTEGER PRIMARY KEY AUTOINCREMENT,
  	  username TEXT UNIQUE NOT NULL,
  	  display_name TEXT,
  	  avatar_url TEXT DEFAULT 'static/media/default.jpeg',
  	  status TEXT DEFAULT 'offline',
  	  matches_played INTEGER DEFAULT 0,
  	  matches_won INTEGER DEFAULT 0,
  	  last_active TIMESTAMP,
  	  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
  `);

  console.log('Database initialized at:', DB_PATH);
}

initDb();

export default db;