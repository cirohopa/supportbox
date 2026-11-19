-- ============================================================
--  SupportBox - estrutura do banco de dados (PostgreSQL)
-- ============================================================
--
--  COMO USAR
--  ---------
--  Na maquina que vai hospedar o banco, com o Postgres ja instalado:
--
--      createdb -U postgres supportbox
--      psql -U postgres -d supportbox -f banco/schema.sql
--
--  Pode rodar mais de uma vez sem medo: tudo aqui usa IF NOT EXISTS,
--  entao rodar de novo nao apaga nada nem da erro.
--
--  BANCO QUE JA EXISTIA ANTES DE NOVEMBRO? Rode tambem o
--  banco/migracao-novembro.sql. O IF NOT EXISTS pula uma tabela que
--  ja existe inteira - ele nao acrescenta colunas novas, como a
--  prazo_em. Quem acrescenta e a migracao.
--
--  REQUISITO: PostgreSQL 13 ou mais novo. A funcao gen_random_uuid(),
--  usada para gerar os ids, so passou a vir de fabrica nessa versao.
--  Para conferir a sua:  psql -U postgres -c "SELECT version();"
--
--  ------------------------------------------------------------
--  POR QUE OS NOMES ESTAO EM snake_case
--  ------------------------------------------------------------
--  No Postgres a convencao e solicitante_id; no JavaScript e
--  solicitanteId. Em vez de forcar um dos lados a ceder, a traducao
--  acontece num lugar so: as funcoes paraChamado / paraComentario,
--  dentro das DAOs. Se uma coluna mudar de nome, mexe-se ali e mais
--  nenhuma camada percebe.
-- ============================================================


-- ------------------------------------------------------------
--  Tabela: chamados
-- ------------------------------------------------------------
--  Um chamado e um pedido de atendimento. Nasce "aberto" e sem
--  agente; caminha para "em_andamento" quando um agente assume, e
--  para "concluido" quando ele encerra (REGRAS_DE_NEGOCIO, regra 1).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chamados (
  -- Chave interna. O banco gera sozinho a cada INSERT, por isso o
  -- codigo nunca informa um id ao criar um chamado.
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Codigo legivel para humanos, no formato CH-AAAA-NNN (regra 4).
  -- UNIQUE porque dois chamados jamais podem repetir protocolo - se a
  -- contagem falhar por qualquer motivo, o banco recusa a gravacao em
  -- vez de deixar passar duplicado.
  protocolo       text        NOT NULL UNIQUE,

  titulo          text        NOT NULL,
  descricao       text        NOT NULL,

  -- Os CHECK abaixo repetem, no banco, validacoes que o Service ja faz.
  -- Nao e desperdicio: e a ultima linha de defesa. Se alguem gravar
  -- direto pelo psql, ou um bug futuro escapar do Service, o banco
  -- ainda recusa um valor invalido.
  categoria       text        NOT NULL
                              CHECK (categoria IN ('hardware', 'software', 'acesso', 'rede')),

  tipo            text        NOT NULL
                              CHECK (tipo IN ('incidente', 'solicitacao')),

  status          text        NOT NULL DEFAULT 'aberto'
                              CHECK (status IN ('aberto', 'em_andamento', 'concluido')),

  prioridade      text        NOT NULL DEFAULT 'media'
                              CHECK (prioridade IN ('baixa', 'media', 'alta')),

  -- Quem abriu e quem atende. Guardam o E-MAIL da pessoa, que e o id
  -- usado em todo o sistema (inclusive na tabela usuarios). Ficam como
  -- TEXT, e nao como uuid REFERENCES usuarios(id), de proposito: assim
  -- os chamados antigos nao precisaram ser migrados, e o Telegram
  -- continua identificando o agente pelo e-mail.
  solicitante_id  text        NOT NULL,
  agente_id       text,       -- nulo enquanto o chamado esta "aberto"

  -- timestamptz (e nao timestamp) guarda o fuso junto. Sem isso, uma
  -- data gravada aqui seria lida errado por quem estivesse em outro
  -- fuso - e o prazo de 7 dias da regra 7 sairia torto.
  criado_em       timestamptz NOT NULL DEFAULT now(),
  concluido_em    timestamptz,           -- nulo ate a conclusao

  -- Prazo de resolucao (SLA, regra 6), calculado pelo Service em dias
  -- uteis a partir da prioridade: alta 1, media 3, baixa 5. Aceita
  -- nulo porque chamados antigos podem nao ter prazo.
  prazo_em        timestamptz
);

-- A listagem principal ordena por criado_em DESC (mais novos primeiro).
-- Este indice evita que o banco precise reordenar a tabela inteira a
-- cada carregamento da tela.
CREATE INDEX IF NOT EXISTS idx_chamados_criado_em
    ON chamados (criado_em DESC);


-- ------------------------------------------------------------
--  Tabela: comentarios
-- ------------------------------------------------------------
--  A conversa de um chamado. Comentarios sao IMUTAVEIS (regra 5):
--  nao ha coluna "editado_em" porque nao existe edicao, e nao ha
--  metodo de apagar em nenhuma camada do sistema.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comentarios (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REFERENCES amarra o comentario a um chamado que EXISTE: o banco
  -- recusa gravar um comentario apontando para um chamado inventado.
  -- ON DELETE CASCADE significa que, se um chamado for apagado, os
  -- comentarios dele vao junto - nao sobram orfaos na tabela.
  chamado_id  uuid        NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,

  -- Id de quem escreveu, ou a palavra 'Sistema' para os comentarios
  -- automaticos de mudanca de status/atribuicao/prioridade (regra 5,
  -- ainda nao implementada no codigo).
  autor       text        NOT NULL,

  texto       text        NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- A consulta mais comum e "todos os comentarios do chamado X, em ordem
-- cronologica". Um indice com as duas colunas na ordem em que sao
-- usadas atende filtro e ordenacao de uma vez.
CREATE INDEX IF NOT EXISTS idx_comentarios_chamado
    ON comentarios (chamado_id, criado_em ASC);


-- ------------------------------------------------------------
--  Tabela: usuarios
-- ------------------------------------------------------------
--  Quem pode entrar no sistema (item 1 - autenticacao real). A senha
--  NUNCA e guardada: so o resumo dela (senha_hash, no formato
--  salt:hash), gerado pelo src/utils/senha.ts. Do resumo nao da para
--  voltar a senha, entao se o banco vazar, as senhas nao vazam.
--
--  Nao ha tela de cadastro: os usuarios sao criados pelo terminal,
--  com  npm run criar-usuario -- email senha papel "Nome".
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  nome        text        NOT NULL,

  -- O e-mail e o login e tambem o id gravado nos chamados. UNIQUE
  -- porque duas pessoas nao podem entrar com o mesmo e-mail.
  email       text        NOT NULL UNIQUE,

  senha_hash  text        NOT NULL,

  papel       text        NOT NULL
                          CHECK (papel IN ('solicitante', 'agente')),

  criado_em   timestamptz NOT NULL DEFAULT now()
);
