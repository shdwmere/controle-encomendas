import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/connection.js';
import { requireAuth } from '../lib/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Tela padrão: sem ?status, já filtra PENDENTE por padrão no client.
// Aqui o backend só obedece o que vier na query.
router.get('/', (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT e.*, m.casa, m.nome AS nome_morador, m.telefone
    FROM encomendas e
    JOIN moradores m ON m.id_morador = e.id_morador
  `;
  const params = [];

  if (status) {
    query += ' WHERE e.status = ?';
    params.push(status);
  }
  query += ' ORDER BY e.data_recebimento ASC';

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { id_morador, destinatario, quantidade, observacao } = req.body;

  if (!id_morador || !destinatario) {
    return res.status(400).json({ erro: 'id_morador e destinatario são obrigatórios' });
  }

  const id_encomenda = crypto.randomUUID();
  db.prepare(`
    INSERT INTO encomendas
      (id_encomenda, id_morador, destinatario, data_recebimento, quantidade, observacao, status)
    VALUES (?, ?, ?, datetime('now'), ?, ?, 'PENDENTE')
  `).run(id_encomenda, id_morador, destinatario, quantidade || 1, observacao || null);

  res.status(201).json({ id_encomenda });
});

router.patch('/:id/entregar', (req, res) => {
  const result = db.prepare(`
    UPDATE encomendas
    SET data_entrega = datetime('now'), status = 'ENTREGUE'
    WHERE id_encomenda = ? AND status = 'PENDENTE'
  `).run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ erro: 'encomenda não encontrada ou já processada' });
  }

  res.json({ ok: true });
});

router.patch('/:id', (req, res) => {
  const { destinatario, quantidade, observacao } = req.body;

  if (!destinatario) {
    return res.status(400).json({ erro: 'destinatario é obrigatório' });
  }

  const result = db.prepare(`
    UPDATE encomendas
    SET destinatario = ?, quantidade = ?, observacao = ?
    WHERE id_encomenda = ?
  `).run(destinatario, quantidade || 1, observacao || null, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ erro: 'encomenda não encontrada' });
  }

  res.json({ ok: true });
});

router.get('/:id', (req, res) => {
  const encomenda = db.prepare(`
    SELECT e.*, m.casa, m.nome AS nome_morador, m.telefone
    FROM encomendas e
    JOIN moradores m ON m.id_morador = e.id_morador
    WHERE e.id_encomenda = ?
  `).get(req.params.id);

  if (!encomenda) return res.status(404).json({ erro: 'encomenda não encontrada' });
  res.json(encomenda);
});

export default router;