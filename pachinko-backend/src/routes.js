const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./store');
const { weightedPick } = require('./utils');

const STAFF_SECRET = process.env.STAFF_SECRET || 'staff123';

router.get('/state', (req, res) => {
  const d = readData();
  res.json({ prizes: d.prizes, layout: d.layout, stats: d.stats });
});

router.post('/spin', (req, res) => {
  const d = readData();
  const prize = weightedPick(d.prizes);
  const columns = d.layout.columns || 9;
  const requested = (req.body && typeof req.body.requestedColumn === 'number') ? req.body.requestedColumn : undefined;
  let column;
  if (typeof requested === 'number') column = Math.max(0, Math.min(columns-1, Math.floor(requested)));
  else if (prize.column !== null && prize.column !== undefined) column = Math.max(0, Math.min(columns-1, prize.column));
  else column = Math.floor(Math.random() * columns);

  d.stats.plays = (d.stats.plays || 0) + 1;
  d.stats.wins[prize.id] = (d.stats.wins[prize.id] || 0) + 1;
  writeData(d);

  res.json({ success: true, prize: { id: prize.id, label: prize.label }, column, stats: d.stats });
});

router.post('/prizes', (req, res) => {
  const secret = req.header('x-staff-secret');
  if (secret !== STAFF_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const { prizes, layout } = req.body;
  const d = readData();
  if (Array.isArray(prizes)) d.prizes = prizes;
  if (layout && typeof layout === 'object') d.layout = Object.assign(d.layout, layout);
  writeData(d);
  res.json({ success: true, prizes: d.prizes, layout: d.layout });
});

router.get('/stats', (req, res) => {
  const secret = req.header('x-staff-secret');
  if (secret !== STAFF_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const d = readData();
  res.json({ stats: d.stats });
});

router.post('/stats/reset', (req, res) => {
  const secret = req.header('x-staff-secret');
  if (secret !== STAFF_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  const d = readData();
  d.stats = { plays: 0, wins: {} };
  writeData(d);
  res.json({ success: true });
});

module.exports = router;
