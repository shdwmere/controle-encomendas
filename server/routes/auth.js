import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/connection.js';
import { sessions } from '../lib/sessions.js'

const router = Router();

router.post('/login', (req, res) => {
	const { usuario, senha } = req.body;

	if (!usuario || !senha) {
		return res.status(400).json({ erro: 'usuario e senha sao obrigatorios!' });
	}

const row = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);

if (!row || !bcrypt.compareSync(senha, row.senha_hash)) {
	return res.status(401).json({ erro: 'usuario ou senha incorretos' })
}

const token = crypto.randomUUID();
sessions.set(token, { id_usuario: row.id_usuario, usuario: row.usuario });

res.json({ token, usuario: row.usuario });
console.log(`[+] usuario '${usuario}' logado com sucesso!`)
});

router.post('/logout', (req, res) => {
	const token = req.headers.authorization?.replace('Bearer ', '');
	sessions.delete(token);
	res.status(204).end();
	console.log('[-] usuario deslogado')
});

export default router;