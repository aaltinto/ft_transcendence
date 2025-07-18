import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR: string = 'app/data';
const DB_PATH: string = path.join(DATA_DIR, 'auth.db');

if (!fs.existsSync(DATA_DIR))
    fs.mkdirSync(DATA_DIR, {recursive: true});

const db = Database(DB_PATH);

function initDB() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("DB created at ", DB_PATH);
}

initDB();

export default db;
