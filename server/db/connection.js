import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database(path.join(__dirname, 'encomendas.db'));
db.pragma('journal_mode = WAL');

const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

export default db