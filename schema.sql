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

INSERT OR IGNORE INTO equipment (id, name, location) VALUES ('eq-1', 'Projector A', 'Building 1');
INSERT OR IGNORE INTO equipment (id, name, location) VALUES ('eq-2', 'Camera B', 'Building 2');
