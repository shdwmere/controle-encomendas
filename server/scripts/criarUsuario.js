import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/connection.js';

const [, , usuario, senha] = process.argv;

if(!usuario || !senha){
	console.log('uso: npm run criar-usuario -- <usuario> <senha>');
	process.exit(1);
}

const jaExiste = db.prepare('SELECT 1 FROM usuarios WHERE usuario = ?').get(usuario);
if(jaExiste) {
	console.log(`usuario "${usuario}" já existe`);
	process.exit(1);
}

const senha_hash = bcrypt.hashSync(senha, 10);
db.prepare('INSERT INTO usuarios (id_usuario, usuario, senha_hash) VALUES (?, ?, ?)')
	.run(crypto.randomUUID(), usuario, senha_hash);

console.log(`usuario "${usuario}"" criado com sucesso!`);