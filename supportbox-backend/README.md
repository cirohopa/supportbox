# SupportBox Backend

API REST do SupportBox. No padrao MVC, este projeto implementa duas das
tres camadas:

- **Controller** — recebe a requisicao HTTP, confere o formato e responde.
- **Model** — o "miolo" do sistema. Aqui ele **nao e uma camada unica**:
  esta dividido em **Service** (regras de negocio / validacao) e **DAO**
  (persistencia e comunicacao com o banco).

A camada **View** vive em outro projeto (`supportbox-frontend`, em
Next.js).

> **Estado atual:** chamados, comentarios, triagem por IA, relatorios e
> **login** funcionam de ponta a ponta — Controller -> Service -> DAO ->
> **PostgreSQL** rodando na maquina de um integrante do grupo (veja
> `banco/COMO_RODAR.md`). O login e real: a senha fica guardada so como
> resumo (scrypt) e cada pessoa recebe um token de sessao assinado. Toda
> mudanca de status, responsavel ou prioridade fica registrada no
> historico, e cada chamado tem um prazo de resolucao em dias uteis. O
> backend tambem liga um **bot do Telegram**, por onde o agente comenta e
> conclui chamados em linguagem natural. Nao usamos framework (so o `http`
> nativo do Node). A biblioteca **Zod** e usada apenas para conferir as
> respostas da IA.

## 1. Arquitetura

```
Cliente HTTP (frontend Next.js)        Bot do Telegram (src/telegram.ts)
      |                                        |
      v                                        v
  Controller            recebe o pedido, identifica quem pede, responde
      |
      v
  Model
  |- Service            regras de negocio / validacao
  |     |               (login, chamados, comentarios, relatorios, triagem)
  |     v
  '- DAO                persistencia (PostgreSQL, via biblioteca `pg`)

  A IA (Google Gemini, src/ia.ts) e chamada por dois Services:
  TriagemService (sugere passos e prioridade na abertura) e
  AssistenteService (interpreta a mensagem do agente no Telegram).
  Ela so interpreta texto: quem executa as acoes sao os Services.
```

O Telegram entrou como **mais uma porta de entrada**: o `TelegramController`
chama os mesmos Services que os Controllers HTTP, entao as regras de negocio
nao foram reescritas.

Por que separar Service de DAO dentro do Model:

- O **Service** responde "isso esta de acordo com as regras do sistema?".
  Ele nao sabe nada de HTTP nem de SQL.
- O **DAO** responde "como eu gravo/leio isso no banco?". Ele nao conhece
  nenhuma regra de negocio.

Principios aplicados:

- **SRP** (responsabilidade unica): cada Controller cuida de um unico
  recurso (Auth, Chamados, Comentarios, Relatorios, Triagem); Service e DAO
  tambem tem papeis bem delimitados.
- **OCP** (aberto/fechado): novos endpoints entram como novos metodos,
  sem mexer nos existentes.

## 2. Como rodar

**Antes de tudo:** o banco precisa estar de pe. O passo a passo completo
(instalar o PostgreSQL, criar as tabelas e liberar o acesso pela rede) esta
em **[`banco/COMO_RODAR.md`](banco/COMO_RODAR.md)**. Se o banco ja existia
antes de novembro, rode tambem, uma vez, o `banco/migracao-novembro.sql`
(cria a tabela `usuarios` e a coluna `prazo_em`).

```
npm install
cp .env.example .env    # preencha DATABASE_URL, GEMINI_API_KEY e SESSAO_SEGREDO
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
| `GEMINI_API_KEY` | **sim** | — |
| `SESSAO_SEGREDO` | **sim** | — |
| `TELEGRAM_BOT_TOKEN` | nao (sem ele o bot nao liga) | — |
| `TELEGRAM_AGENTES` | nao (lista `idTelegram:email`) | — |

Sem `DATABASE_URL`, `GEMINI_API_KEY` ou `SESSAO_SEGREDO` o servidor **nao
sobe**: o arquivo que usa cada uma (`db.ts`, `ia.ts` e `utils/token.ts`)
falha logo no inicio com uma mensagem clara. O `.env` esta no `.gitignore` e
nunca vai para o Git — ele guarda a senha do banco, a chave da IA, a chave
das sessoes e o token do bot.

**Cadastrar usuarios:** nao existe tela de cadastro. Os usuarios sao criados
pelo terminal; a senha e guardada so como resumo:

```
npm run criar-usuario -- email senha papel "Nome Completo"
npm run criar-usuario -- renata@empresa.com umaSenhaBoa agente "Renata Esther"
```

**Login:** `POST /api/auth/login` com `{ "email", "senha" }` devolve
`{ token, usuario }`. Todas as outras rotas exigem o token no cabecalho:

```
Authorization: Bearer <token>
```

Sem token, com token alterado ou vencido (8 horas), a API responde `401`.
Exemplo:

```
curl http://localhost:4000/api/chamados -H "Authorization: Bearer <token>"
```

## 3. Estrutura de pastas

```
supportbox-backend/
|- REGRAS_DE_NEGOCIO.md       regras que a camada Service aplica
|- banco/
|  |- schema.sql              cria as tabelas (rodar uma vez no Postgres)
|  |- migracao-novembro.sql   usuarios + prazo_em, para bancos ja existentes
|  '- COMO_RODAR.md           instalar o banco e liberar acesso pela rede
|- src/
|  |- controllers/            traducao pedido <-> Service
|  |  |- AuthController.ts       login, "quem sou eu" e sair
|  |  |- ChamadosController.ts
|  |  |- ComentariosController.ts
|  |  |- RelatoriosController.ts
|  |  |- TriagemController.ts
|  |  '- TelegramController.ts   porta de entrada do Telegram (laco do bot)
|  |- services/               Model: camada Service (regras de negocio)
|  |  |- AuthService.ts          confere e-mail e senha e entrega o token
|  |  |- ChamadosService.ts      regras dos chamados, historico e prazo
|  |  |- ComentariosService.ts
|  |  |- RelatoriosService.ts
|  |  |- TriagemService.ts       IA: passos sugeridos e prioridade
|  |  |- AssistenteService.ts    IA: interpreta a mensagem do Telegram
|  |  '- prazos.ts               calculo do prazo em dias uteis (regra 6)
|  |- dao/                    Model: camada DAO (persistencia em SQL)
|  |  |- ChamadosDAO.ts
|  |  |- ComentariosDAO.ts
|  |  |- RelatoriosDAO.ts
|  |  '- UsuariosDAO.ts
|  |- routes/                 mapa de URL -> metodo do controller
|  |  '- index.ts
|  |- scripts/
|  |  '- criarUsuario.ts       comando "npm run criar-usuario"
|  |- utils/                  infraestrutura (sem regra de negocio)
|  |  |- http.ts              tipos compartilhados + resposta JSON + traducao de erro
|  |  |- corpo.ts             leitor de corpo JSON
|  |  |- ator.ts              identifica quem pede, lendo o token de sessao
|  |  |- token.ts             cria e confere o token de sessao assinado
|  |  '- senha.ts             gera e confere o resumo da senha (scrypt)
|  |- dominio.ts              tipos do dominio (usuario, chamado, comentario...)
|  |- erros.ts                erros de dominio (Validacao, NaoAutenticado, AcessoNegado, NaoEncontrado)
|  |- db.ts                   conexao unica com o Postgres (pool), usada pelas DAOs
|  |- ia.ts                   conexao com o Google Gemini (le a GEMINI_API_KEY)
|  |- telegram.ts             conversa com a API de bots do Telegram (so fetch)
|  |- app.ts                  dispatcher de rotas (http nativo, sem framework)
|  '- server.ts               sobe o servidor HTTP
|- package.json
|- tsconfig.json
|- .env.example
'- .gitignore
```

Este projeto ja trocou de banco **duas vezes** — de dados em memoria para um
banco hospedado e, depois, para o PostgreSQL nativo — e as duas trocas foram
**locais as DAOs** (mais o arquivo de conexao). O Service e o Controller
nunca precisaram saber que o banco mudou. E o retorno pratico de manter as
camadas separadas.

Da primeira vez houve um unico efeito em cadeia: como ir ao banco leva tempo,
as DAOs viraram assincronas e o `await` subiu por Service e Controller. Da
segunda (para o PostgreSQL nativo), **nenhuma linha fora de `src/dao/` e
`src/db.ts` mudou**.

A troca da identificacao temporaria pelo login real seguiu a mesma logica:
como so o `utils/ator.ts` sabia de onde vinha a identidade, os Controllers
nao mudaram de logica.

## 4. Convencoes

- **Documentacao farta:** cada arquivo abre com um bloco explicando seu
  papel, e cada funcao/metodo tem JSDoc descrevendo o que faz e por que.
- **Idioma:** nomes do dominio em portugues (Chamado, Comentario,
  Solicitante, Agente); conceitos de plataforma em ingles (Controller,
  Request, Response).
- **Controller nao decide regra de negocio:** ele so confere o formato da
  entrada e responde. Quem decide regra e o Service; quem fala com o banco
  e o DAO.

## 5. O que ja foi feito e o que vem pela frente

- [x] Etapa 1: Controllers + documento de regras de negocio.
- [x] Etapa 2: Camada **Service** (regras de negocio) — chamados e
  comentarios.
- [x] Etapa 3: Camada **DAO** em memoria (chamados: criar/ler/atualizar;
  comentarios: criar/ler).
- [x] Etapa 4: Ligar Controller -> Service -> DAO (chamados/comentarios) +
  CORS habilitado.
- [x] Etapa 5: Trocar a memoria por um banco de verdade (DAOs assincronas)
  e integrar com o frontend.
- [x] Etapa 6: Migrar para **PostgreSQL nativo**, rodando na maquina de um
  integrante. SQL escrito a mao, biblioteca `pg`.
- [x] Etapa 7: **Triagem por IA** na abertura (Google Gemini): passos
  sugeridos e prioridade, gravada no chamado.
- [x] Etapa 8: **Relatorio de atendimentos** por periodo.
- [x] Etapa 9: **Bot do Telegram**: o agente comenta e conclui chamados em
  linguagem natural, passando pelos mesmos Services.
- [x] Etapa 10: **Login real** (senha protegida e token de sessao),
  **historico automatico** do "Sistema" (regra 5) e **prazo de resolucao**
  em dias uteis (regra 6).
- [ ] Etapa 11: publicacao fora da maquina local e testes automatizados.

### Regras ainda nao implementadas por completo

Estao documentadas em `REGRAS_DE_NEGOCIO.md`:

- **Regra 6 (parcial):** so o prazo de **resolucao** existe, contado em dias
  uteis (segunda a sexta). Ainda faltam o prazo de 1a resposta, a pausa do
  cronometro enquanto se espera o solicitante e os feriados.
- **Regra 2 (parcial):** o `/atribuir` ainda nao confere se o novo
  responsavel e um agente cadastrado na tabela `usuarios`.

### Limitacao conhecida do login

O token nao fica guardado no servidor. Por isso "sair" apaga o token so no
navegador: uma copia dele continuaria valendo ate vencer (8 horas).
