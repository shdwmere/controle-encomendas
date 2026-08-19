import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new DatabaseSync(path.join(__dirname, 'encomendas.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_mode = ON');

const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

export default db
