import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/connection.js';
import { requireAuth } from '../lib/requireAuth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const moradores = db.prepare('SELECT * FROM moradores ORDER BY casa').all();
  res.json(moradores);
});

router.post('/', (req, res) => {
  const { casa, nome, telefone } = req.body;

  if (!casa || !nome) {
    return res.status(400).json({ erro: 'casa e nome são obrigatórios' });
  }

  const id_morador = crypto.randomUUID();
  db.prepare('INSERT INTO moradores (id_morador, casa, nome, telefone) VALUES (?, ?, ?, ?)')
    .run(id_morador, casa, nome, telefone || null);

  res.status(201).json({ id_morador, casa, nome, telefone: telefone || null });
});

router.get('/:id', (req, res) => {
  const morador = db.prepare('SELECT * FROM moradores WHERE id_morador = ?').get(req.params.id);
  if (!morador) return res.status(404).json({ erro: 'morador não encontrado' });
  res.json(morador);
});

router.patch('/:id', (req, res) => {
  const { casa, nome, telefone } = req.body;

  if (!casa || !nome) {
    return res.status(400).json({ erro: 'casa e nome são obrigatórios' });
  }

  const result = db.prepare(
    'UPDATE moradores SET casa = ?, nome = ?, telefone = ? WHERE id_morador = ?'
  ).run(casa, nome, telefone || null, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ erro: 'morador não encontrado' });
  }

  res.json({ id_morador: req.params.id, casa, nome, telefone: telefone || null });
});

router.delete('/:id', (req, res) => {
  const { count } = db.prepare(
    'SELECT COUNT(*) AS count FROM encomendas WHERE id_morador = ?'
  ).get(req.params.id);

  if (count > 0) {
    return res.status(409).json({
      erro: `não é possível excluir: existem ${count} encomenda(s) vinculada(s) a esse morador`,
    });
  }

  const result = db.prepare('DELETE FROM moradores WHERE id_morador = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ erro: 'morador não encontrado' });
  }

  res.status(204).end();
});

export default router;