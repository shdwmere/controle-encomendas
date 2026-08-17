CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario TEXT PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moradores (
  id_morador TEXT PRIMARY KEY,
  casa TEXT NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT
);

CREATE TABLE IF NOT EXISTS encomendas (
  id_encomenda TEXT PRIMARY KEY,
  id_morador TEXT NOT NULL REFERENCES moradores(id_morador),
  destinatario TEXT NOT NULL,
  data_recebimento TEXT NOT NULL,
  data_entrega TEXT,
  quantidade INTEGER DEFAULT 1,
  observacao TEXT,
  status TEXT CHECK(status IN ('PENDENTE','ENTREGUE','DEVOLVIDA')) DEFAULT 'PENDENTE'
);

CREATE INDEX IF NOT EXISTS idx_encomendas_status ON encomendas(status);
CREATE INDEX IF NOT EXISTS idx_encomendas_morador ON encomendas(id_morador);