const fs = require('fs');
const path = require('path');

const cors = require('cors');
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.API_KEY || '';
const DATA_FILE = path.join(__dirname, '..', 'data', 'tokens.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function ensureStore() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function loadTokens() {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function saveTokens(tokens) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tokens, null, 2), 'utf8');
}

function requireApiKey(req, res, next) {
  if (!API_KEY) {
    return next();
  }

  const key = req.header('x-api-key');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

let tokens = loadTokens();

app.get('/health', (_req, res) => {
  res.json({ ok: true, count: tokens.length });
});

app.post('/tokens', requireApiKey, (req, res) => {
  const { token, deviceLabel } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }

  const existing = tokens.find((item) => item.token === token);
  if (!existing) {
    tokens = [
      ...tokens,
      {
        token,
        deviceLabel: deviceLabel || 'unknown',
        createdAt: new Date().toISOString(),
      },
    ];
    saveTokens(tokens);
  }

  return res.json({ ok: true, count: tokens.length });
});

app.post('/notify', requireApiKey, async (req, res) => {
  const { token, title, body, data } = req.body;
  const recipients = token ? [token] : tokens.map((item) => item.token);

  if (!recipients.length) {
    return res.status(400).json({ error: 'No tokens registered.' });
  }

  const messages = recipients.map((pushToken) => ({
    to: pushToken,
    title: title || 'Order update',
    body: body || 'Your order status changed.',
    sound: 'default',
    data: data || {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const payload = await response.json();
    return res.json({ ok: true, response: payload });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send notification.' });
  }
});

app.listen(PORT, () => {
  console.log(`Notification backend running on port ${PORT}`);
});
