-- ============================================================
--  SupportBox - migracao de novembro (autenticacao real e prazos)
-- ============================================================
--
--  QUANDO USAR
--  -----------
--  Num banco que JA EXISTE (criado com o schema.sql antigo). Quem
--  esta criando o banco do zero nao precisa deste arquivo: o
--  schema.sql ja vem com tudo.
--
--      psql -U supportbox -d supportbox -v ON_ERROR_STOP=1 -f banco/migracao-novembro.sql
--
--  Pode rodar mais de uma vez sem medo: tudo aqui usa IF NOT EXISTS,
--  e o preenchimento do prazo so mexe em chamados ainda sem prazo.
--
--  ------------------------------------------------------------
--  POR QUE UM ARQUIVO SEPARADO DO schema.sql
--  ------------------------------------------------------------
--  O CREATE TABLE IF NOT EXISTS do schema.sql pula a tabela inteira
--  quando ela ja existe - ele NAO acrescenta colunas novas. Por isso
--  a coluna prazo_em precisa de um ALTER TABLE, que mora aqui.
--
--  ------------------------------------------------------------
--  POR QUE BEGIN / COMMIT
--  ------------------------------------------------------------
--  Tudo entre os dois vira uma transacao: ou todos os comandos dao
--  certo, ou nenhum e aplicado. Se o UPDATE falhar, a tabela e a
--  coluna novas tambem sao desfeitas - o banco nunca fica pela metade.
-- ============================================================

BEGIN;


-- ------------------------------------------------------------
--  Tabela nova: usuarios (item 1 - autenticacao real)
-- ------------------------------------------------------------
--  Quem pode entrar no sistema. A senha NUNCA e guardada: so o
--  resumo dela (senha_hash, no formato salt:hash), gerado pelo
--  src/utils/senha.ts. Se o banco vazar, as senhas nao vazam.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  nome        text        NOT NULL,

  -- O e-mail e o login e tambem o id usado nos chamados
  -- (solicitante_id e agente_id). UNIQUE porque duas pessoas nao
  -- podem entrar com o mesmo e-mail.
  email       text        NOT NULL UNIQUE,

  senha_hash  text        NOT NULL,

  -- Mesma ideia dos CHECK da tabela chamados: ultima linha de defesa
  -- contra um papel inventado, mesmo que o codigo falhe.
  papel       text        NOT NULL
                          CHECK (papel IN ('solicitante', 'agente')),

  criado_em   timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  Coluna nova: chamados.prazo_em (item 3 - SLA e prazos)
-- ------------------------------------------------------------
--  Prazo de resolucao, calculado pelo Service (services/prazos.ts)
--  em dias uteis. Aceita nulo para nao travar chamados antigos.
-- ------------------------------------------------------------
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS prazo_em timestamptz;


-- ------------------------------------------------------------
--  Prazo dos chamados que ja existem
-- ------------------------------------------------------------
--  Para dados antigos, dias corridos bastam: 1 dia (alta), 3 dias
--  (media) e 5 dias (baixa) a partir da abertura.
--
--  O WHERE prazo_em IS NULL e o que deixa rodar de novo sem estrago:
--  na segunda vez, os chamados ja tem prazo e nada e sobrescrito -
--  inclusive os prazos que o sistema calcular em dias uteis.
-- ------------------------------------------------------------
UPDATE chamados
   SET prazo_em = criado_em + CASE prioridade
         WHEN 'alta'  THEN interval '1 day'
         WHEN 'media' THEN interval '3 days'
         WHEN 'baixa' THEN interval '5 days'
       END
 WHERE prazo_em IS NULL;


COMMIT;
