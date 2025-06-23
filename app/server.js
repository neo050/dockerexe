import express from 'express';
import path from 'path';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// -----------------------------------------------------------------------------
// MongoDB connection
// -----------------------------------------------------------------------------
const mongoUrl =
  process.env.MONGO_URL ??
  'mongodb://admin:secret@localhost:27017/?authSource=admin';
const dbName = 'user-account';

console.log('[BOOT] MONGO_URL =', mongoUrl);
console.log('[BOOT] DB        =', dbName);

const client = new MongoClient(mongoUrl);
await client.connect();
console.log('[BOOT] Connected to MongoDB');
const db = client.db(dbName);

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/profile-picture', (_req, res) => {
  const img = fs.readFileSync(
    path.join(__dirname, 'images/profile-1.jpg')
  );
  res.writeHead(200, { 'Content-Type': 'image/jpeg' });
  res.end(img);
});

app.post('/update-profile', async (req, res, next) => {
  try {
    console.log('[POST] /update-profile payload:', req.body);

    const user = { ...req.body, userid: 1 };

    const result = await db.collection('users').updateOne(
      { userid: 1 },
      { $set: user },
      { upsert: true }
    );

    console.log('[DB] updateOne result:', result);

    res.json(user);
  } catch (err) {
    next(err);
  }
});

app.get('/get-profile', async (_req, res, next) => {
  try {
    const user = await db
      .collection('users')
      .findOne({ userid: 1 });

    console.log('[GET] /get-profile →', user);
    res.json(user ?? {});
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// Error handler
// -----------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'internal-server-error' });
});

// -----------------------------------------------------------------------------
// Server start
// -----------------------------------------------------------------------------
app.listen(3000, () =>
  console.log('[BOOT] App listening on port 3000')
);
