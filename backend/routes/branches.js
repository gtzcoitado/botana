// backend/routes/branches.js
const express = require('express');
const Branch  = require('../models/Branch');
const router  = express.Router();

// ── Filiais ────────────────────────────────────────────

// GET /api/branches
router.get('/', async (req, res) => {
  const list = await Branch.find();
  res.json(list);
});

// POST /api/branches
router.post('/', async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json(branch);
});

// PUT /api/branches/:id
router.put('/:id', async (req, res) => {
  const updated = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.sendStatus(404);
  res.json(updated);
});

// DELETE /api/branches/:id
router.delete('/:id', async (req, res) => {
  const deleted = await Branch.findByIdAndDelete(req.params.id);
  if (!deleted) return res.sendStatus(404);
  res.json({ ok: true });
});

// ── Informações de cada filial ────────────────────────

// GET  /api/branches/:id/infos
router.get('/:id/infos', async (req, res) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return res.sendStatus(404);
  res.json(b.infos);
});

// POST /api/branches/:id/infos
router.post('/:id/infos', async (req, res) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return res.sendStatus(404);
  b.infos.push(req.body);
  await b.save();
  res.status(201).json(b.infos);
});

// PUT  /api/branches/:id/infos/:infoId
router.put('/:id/infos/:infoId', async (req, res) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return res.sendStatus(404);
  const info = b.infos.id(req.params.infoId);
  if (!info) return res.sendStatus(404);
  info.set(req.body);
  await b.save();
  res.json(b.infos);
});

// DELETE /api/branches/:id/infos/:infoId
router.delete('/:id/infos/:infoId', async (req, res) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return res.sendStatus(404);
  const info = b.infos.id(req.params.infoId);
  if (!info) return res.sendStatus(404);
  info.remove();
  await b.save();
  res.json({ ok: true });
});

module.exports = router;
