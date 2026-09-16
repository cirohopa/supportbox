# SupportBox Backend

API REST do SupportBox. No padrao MVC, este projeto implementa duas das
tres camadas:

- **Controller** — recebe a requisicao HTTP, confere o formato e responde.
- **Model** — o "miolo" do sistema. Aqui ele **nao e uma camada unica**:
  esta dividido em **Service** (regras de negocio / validacao) e **DAO**
  (persistencia e comunicacao com o banco).

A camada **View** vive em outro projeto (`supportbox`, o frontend em
Next.js).

> **Estado atual:** os endpoints de **chamados** e **comentarios** funcionam
> de ponta a ponta — Controller -> Service -> DAO -> **PostgreSQL** rodando na
> maquina de um integrante do grupo (veja `banco/COMO_RODAR.md`).
> So **autenticacao** (`/api/auth/*`) ainda responde `501`: nao ha regras de
> auth nem `AuthService` ainda. Enquanto a auth real nao chega, a identidade
> de quem chama vem de cabecalhos temporarios (`X-Usuario-Id` e
> `X-Usuario-Papel`) — veja "Como rodar". O **CORS** ja esta habilitado para
> o frontend. Nao usamos framework (so o `http` nativo do Node) nem
> biblioteca de validacao de schema.

## 1. Arquitetura

```
Cliente HTTP  (View / frontend Next.js, outro projeto)
      |
      v
  Controller            recebe HTTP, confere o formato, responde
      |
      v
  Model
  |- Service            regras de negocio / validacao   (chamados + comentarios)
  |     |
  |     v
  '- DAO                persistencia (PostgreSQL, via biblioteca `pg`)
```

Por que separar Service de DAO dentro do Model:

- O **Service** responde "isso esta de acordo com as regras do sistema?".
  Ele nao sabe nada de HTTP nem de SQL.
- O **DAO** responde "como eu gravo/leio isso no banco?". Ele nao conhece
  nenhuma regra de negocio.

Principios aplicados:

- **SRP** (responsabilidade unica): cada Controller cuida de um unico
  recurso (Auth, Chamados, Comentarios); Service e DAO tambem tem papeis
  bem delimitados.
- **OCP** (aberto/fechado): novos endpoints entram como novos metodos,
  sem mexer nos existentes.

## 2. Como rodar

**Antes de tudo:** o banco precisa estar de pe. O passo a passo completo
(instalar o PostgreSQL, criar as tabelas e liberar o acesso pela rede) esta
em **[`banco/COMO_RODAR.md`](banco/COMO_RODAR.md)**.

```
npm install
cp .env.example .env    # e preencha a DATABASE_URL
npm run dev             # sobe em http://localhost:4000 com reload (tsx watch)
```

As variaveis de ambiente sao lidas do arquivo **`.env`** (carregado pelo
`dotenv` na primeira linha de `src/server.ts`). Use o `.env.example` como
modelo — ele lista todas as variaveis com explicacao:

| Variavel | Obrigatoria? | Padrao |
|---|---|---|
| `PORT` | nao | `4000` |
| `ORIGEM_FRONTEND` | nao | `http://localhost:3000` |
| `DATABASE_URL` | **sim** | — |

Sem a `DATABASE_URL` o servidor **nao sobe**: `src/db.ts` falha logo no
inicio com uma mensagem clara (melhor do que quebrar so na primeira consulta
ao banco). O `.env` esta no `.gitignore` e nunca vai para o Git — ele guarda
a senha do banco.

**Identificacao temporaria (ainda sem login):** como a autenticacao real
nao existe, toda chamada aos endpoints de chamados/comentarios precisa de
dois cabecalhos dizendo quem e voce:

```
X-Usuario-Id: u-123
X-Usuario-Papel: solicitante      # ou: agente
```

Sem eles, a API responde `401`. Exemplo:

```
curl http://localhost:4000/api/chamados \
  -H "X-Usuario-Id: u-123" -H "X-Usuario-Papel: agente"
```

Os endpoints de `/api/auth/*` ainda respondem `501` (a autenticacao entra
em etapa futura).

## 3. Estrutura de pastas

```
supportbox-backend/
|- REGRAS_DE_NEGOCIO.md       regras que a camada Service aplica
|- banco/
|  |- schema.sql              cria as tabelas (rodar uma vez no Postgres)
|  '- COMO_RODAR.md           instalar o banco e liberar acesso pela rede
|- src/
|  |- controllers/            traducao HTTP <-> Service (auth ainda 501)
|  |  |- AuthController.ts
|  |  |- ChamadosController.ts
|  |  '- ComentariosController.ts
|  |- services/               Model: camada Service (regras de negocio)
|  |  |- ChamadosService.ts
|  |  '- ComentariosService.ts
|  |- dao/                    Model: camada DAO (persistencia em SQL)
|  |  |- ChamadosDAO.ts
|  |  '- ComentariosDAO.ts
|  |- routes/                 mapa de URL -> metodo do controller
|  |  '- index.ts
|  |- utils/                  infraestrutura HTTP (sem regra de negocio)
|  |  |- http.ts              tipos compartilhados + resposta JSON + traducao de erro
|  |  |- corpo.ts             leitor de corpo JSON
|  |  '- ator.ts              le os cabecalhos X-Usuario-* (auth temporaria)
|  |- dominio.ts              tipos do dominio (papel, status, prioridade, chamado, comentario)
|  |- erros.ts                erros de dominio (Validacao, AcessoNegado, NaoEncontrado)
|  |- db.ts                   conexao unica com o Postgres (pool), usada pelas DAOs
|  |- app.ts                  dispatcher de rotas (http nativo, sem framework)
|  '- server.ts               sobe o servidor HTTP
|- package.json
|- tsconfig.json
|- .env.example
'- .gitignore
```

Este projeto ja trocou de banco **duas vezes** — memoria → Supabase →
PostgreSQL nativo — e as duas trocas foram **locais as DAOs** (mais o arquivo
de conexao). O Service e o Controller nunca precisaram saber que o banco
mudou. E o retorno pratico de manter as camadas separadas.

Da primeira vez houve um unico efeito em cadeia: como ir ao banco leva tempo,
as DAOs viraram assincronas e o `await` subiu por Service e Controller. Da
segunda (Supabase → Postgres), **nenhuma linha fora de `src/dao/` e
`src/db.ts` mudou**.

## 4. Convencoes

- **Documentacao farta:** cada arquivo abre com um bloco explicando seu
  papel, e cada funcao/metodo tem JSDoc descrevendo o que faz e por que.
- **Idioma:** nomes do dominio em portugues (Chamado, Comentario,
  Solicitante, Agente); conceitos de plataforma em ingles (Controller,
  Request, Response).
- **Controller nao decide regra de negocio:** ele so confere o formato da
  entrada e responde. Quem decide regra e o Service; quem fala com o banco
  e o DAO.

## 5. O que vem pela frente

- [x] Etapa 1: Controllers + documento de regras de negocio.
- [x] Etapa 2: Camada **Service** (regras de negocio) — chamados e
  comentarios.
- [x] Etapa 3: Camada **DAO** em memoria (chamados: criar/ler/atualizar;
  comentarios: criar/ler).
- [x] Etapa 4: Ligar Controller -> Service -> DAO (chamados/comentarios) +
  CORS habilitado.
- [x] Etapa 5: Trocar a memoria por um banco de verdade (DAOs assincronas)
  e integrar com o frontend.
- [x] Etapa 6: Migrar do Supabase para **PostgreSQL nativo**, rodando na
  maquina de um integrante. SQL escrito a mao, biblioteca `pg`.
- [ ] Etapa 7: Autenticacao real (login/token) no lugar dos cabecalhos
  temporarios; comentarios automaticos do "Sistema" (regra 5); SLA (regra 6).

### Regras ainda nao implementadas

Estao documentadas em `REGRAS_DE_NEGOCIO.md`, mas ainda **nao valem** no
codigo — nao confie nelas:

- **Regra 5 (parcial):** comentarios automaticos do autor `Sistema` a cada
  mudanca de status, atribuicao ou prioridade. A parte de imutabilidade
  (sem editar/apagar) ja vale.
- **Regra 6:** SLA por prioridade. Nada de prazo e calculado hoje.
- **Regra 2 (parcial):** nao ha como conferir se o id passado em
  `/atribuir` pertence mesmo a um agente — falta a tabela de usuarios,
  que chega junto com a autenticacao.
- **Regra 3 (seguranca):** os cabecalhos `X-Usuario-*` sao autodeclarados.
  Qualquer cliente pode se dizer "agente" e ver todos os chamados. Isso so
  fecha de verdade na etapa de autenticacao.
