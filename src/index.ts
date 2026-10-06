import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Reusable router for API routes
const api = new Hono<{ Bindings: Bindings }>();

// GET /equipment
api.get('/equipment', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, name, location
    FROM equipment
    ORDER BY id ASC
  `).all();
  return c.json(results, 200);
});

// GET /bookings
api.get('/bookings', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, equipmentId, borrowerName, startAt, endAt, purpose
    FROM bookings
    ORDER BY startAt ASC
  `).all();
  return c.json(results, 200);
});

// GET /bookings/:id
api.get('/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const booking = await c.env.DB.prepare(`
    SELECT id, equipmentId, borrowerName, startAt, endAt, purpose
    FROM bookings
    WHERE id = ?
  `).bind(id).first();

  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  return c.json(booking, 200);
});

// POST /bookings
api.post('/bookings', async (c) => {
  let body: any;
  try {
    const text = await c.req.text();
    const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    body = JSON.parse(clean);
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const { equipmentId, borrowerName, startAt, endAt, purpose } = body || {};

  // Validate required fields
  if (
    !equipmentId || typeof equipmentId !== 'string' || !equipmentId.trim() ||
    !borrowerName || typeof borrowerName !== 'string' || !borrowerName.trim() ||
    !startAt || typeof startAt !== 'string' || !startAt.trim() ||
    !endAt || typeof endAt !== 'string' || !endAt.trim() ||
    !purpose || typeof purpose !== 'string' || !purpose.trim()
  ) {
    return c.json({ error: 'Missing or invalid required fields' }, 400);
  }

  // Validate date strings
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return c.json({ error: 'startAt and endAt must be valid date strings' }, 400);
  }

  const normStartAt = startDate.toISOString();
  const normEndAt = endDate.toISOString();

  // Validate startAt < endAt
  if (startDate.getTime() >= endDate.getTime()) {
    return c.json({ error: 'startAt must be before endAt' }, 400);
  }

  // Validate equipment existence
  const equipment = await c.env.DB.prepare('SELECT id FROM equipment WHERE id = ?').bind(equipmentId.trim()).first();
  if (!equipment) {
    return c.json({ error: 'Equipment not found' }, 404);
  }

  // Check overlap for the same equipment: existing.startAt < requested.endAt AND existing.endAt > requested.startAt
  const conflict = await c.env.DB.prepare(`
    SELECT id FROM bookings
    WHERE equipmentId = ?
      AND startAt < ?
      AND endAt > ?
  `).bind(equipmentId.trim(), normEndAt, normStartAt).first();

  if (conflict) {
    return c.json({ error: 'Booking time conflicts with an existing booking' }, 409);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO bookings (id, equipmentId, borrowerName, startAt, endAt, purpose, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, equipmentId.trim(), borrowerName.trim(), normStartAt, normEndAt, purpose.trim(), createdAt).run();

  const created = {
    id,
    equipmentId: equipmentId.trim(),
    borrowerName: borrowerName.trim(),
    startAt: normStartAt,
    endAt: normEndAt,
    purpose: purpose.trim()
  };

  return c.json(created, 201);
});

// PATCH /bookings/:id
api.patch('/bookings/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare(`
    SELECT id, equipmentId, borrowerName, startAt, endAt, purpose
    FROM bookings
    WHERE id = ?
  `).bind(id).first() as { id: string; equipmentId: string; borrowerName: string; startAt: string; endAt: string; purpose: string } | null;

  if (!existing) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  let body: any;
  try {
    const text = await c.req.text();
    const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    body = JSON.parse(clean);
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return c.json({ error: 'Invalid payload' }, 400);
  }

  const { equipmentId, borrowerName, startAt, endAt, purpose } = body;

  if (
    equipmentId === undefined &&
    borrowerName === undefined &&
    startAt === undefined &&
    endAt === undefined &&
    purpose === undefined
  ) {
    return c.json({ error: 'At least one field must be provided for update' }, 400);
  }

  // Validate individual fields if provided
  if (equipmentId !== undefined && (typeof equipmentId !== 'string' || !equipmentId.trim())) {
    return c.json({ error: 'Invalid equipmentId' }, 400);
  }
  if (borrowerName !== undefined && (typeof borrowerName !== 'string' || !borrowerName.trim())) {
    return c.json({ error: 'Invalid borrowerName' }, 400);
  }
  if (purpose !== undefined && (typeof purpose !== 'string' || !purpose.trim())) {
    return c.json({ error: 'Invalid purpose' }, 400);
  }

  let targetStartAt = existing.startAt;
  let targetEndAt = existing.endAt;

  if (startAt !== undefined) {
    if (typeof startAt !== 'string' || !startAt.trim()) {
      return c.json({ error: 'Invalid startAt' }, 400);
    }
    const d = new Date(startAt);
    if (isNaN(d.getTime())) {
      return c.json({ error: 'startAt must be a valid date string' }, 400);
    }
    targetStartAt = d.toISOString();
  }

  if (endAt !== undefined) {
    if (typeof endAt !== 'string' || !endAt.trim()) {
      return c.json({ error: 'Invalid endAt' }, 400);
    }
    const d = new Date(endAt);
    if (isNaN(d.getTime())) {
      return c.json({ error: 'endAt must be a valid date string' }, 400);
    }
    targetEndAt = d.toISOString();
  }

  // Validate startAt < endAt on merged target
  if (new Date(targetStartAt).getTime() >= new Date(targetEndAt).getTime()) {
    return c.json({ error: 'startAt must be before endAt' }, 400);
  }

  const targetEquipmentId = equipmentId !== undefined ? equipmentId.trim() : existing.equipmentId;
  const targetBorrowerName = borrowerName !== undefined ? borrowerName.trim() : existing.borrowerName;
  const targetPurpose = purpose !== undefined ? purpose.trim() : existing.purpose;

  // Validate equipment existence
  const equipment = await c.env.DB.prepare('SELECT id FROM equipment WHERE id = ?').bind(targetEquipmentId).first();
  if (!equipment) {
    return c.json({ error: 'Equipment not found' }, 404);
  }

  // Check overlap for the same equipment, excluding current booking
  const conflict = await c.env.DB.prepare(`
    SELECT id FROM bookings
    WHERE equipmentId = ?
      AND startAt < ?
      AND endAt > ?
      AND id != ?
  `).bind(targetEquipmentId, targetEndAt, targetStartAt, id).first();

  if (conflict) {
    return c.json({ error: 'Booking time conflicts with an existing booking' }, 409);
  }

  await c.env.DB.prepare(`
    UPDATE bookings
    SET equipmentId = ?, borrowerName = ?, startAt = ?, endAt = ?, purpose = ?
    WHERE id = ?
  `).bind(targetEquipmentId, targetBorrowerName, targetStartAt, targetEndAt, targetPurpose, id).run();

  const updated = {
    id,
    equipmentId: targetEquipmentId,
    borrowerName: targetBorrowerName,
    startAt: targetStartAt,
    endAt: targetEndAt,
    purpose: targetPurpose
  };

  return c.json(updated, 200);
});

// DELETE /bookings/:id
api.delete('/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT id FROM bookings WHERE id = ?').bind(id).first();

  if (!existing) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run();
  return c.body(null, 204);
});

// Mount routes at both /api and root /
app.route('/api', api);
app.route('/', api);

// Not found & error handlers
app.notFound((c) => c.json({ error: 'Resource not found' }, 404));
app.onError((err, c) => c.json({ error: err.message || 'Internal server error' }, 500));

export default app;
