-- Mensagens enviadas pelo formulário de contato do site
CREATE TABLE IF NOT EXISTS contatos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  nome          TEXT    NOT NULL,
  empresa       TEXT,
  email         TEXT    NOT NULL,
  perfil        TEXT    NOT NULL CHECK (perfil IN ('marca', 'agencia', 'creator')),
  mensagem      TEXT,
  idioma        TEXT,
  consentimento INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_contatos_criado_em ON contatos (criado_em);
