import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = path.resolve(import.meta.dirname, '..', 'equipment_booking.db');

export const db = new DatabaseSync(dbPath);

// Enable foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    equipmentId TEXT NOT NULL,
    borrowerName TEXT NOT NULL,
    startAt TEXT NOT NULL,
    endAt TEXT NOT NULL,
    purpose TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (equipmentId) REFERENCES equipment(id)
  );
`);

// Seed deterministic equipment records
const seedStmt = db.prepare(`
  INSERT OR IGNORE INTO equipment (id, name, location)
  VALUES (?, ?, ?)
`);

seedStmt.run('eq-1', 'Projector A', 'Building 1');
seedStmt.run('eq-2', 'Camera B', 'Building 2');
