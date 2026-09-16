# Como rodar o banco na maquina de um integrante

Guia da migracao do Supabase para o PostgreSQL nativo.

Um integrante do grupo hospeda o banco na maquina dele; os outros se
conectam pela rede local (o mesmo Wi-Fi / a mesma rede do laboratorio).

> **Divida assim:** so **uma** pessoa faz a Parte 1. Todas as outras fazem
> so a Parte 2, que e bem curtinha.

---

## Atalho: usar o Supabase enquanto o banco local nao esta pronto

**Se o grupo so quer TESTAR agora, pule as Partes 1 e 2 e use isto.**

O Supabase e um PostgreSQL hospedado. Como o projeto usa o driver `pg`
padrao (e nao uma biblioteca especifica do Supabase), o **mesmo codigo
funciona nos dois** — muda so a `DATABASE_URL`.

### 1. Confirme que o projeto esta ativo

No plano gratuito, o Supabase PAUSA o projeto depois de alguns dias sem
uso, e ai o endereco sai do ar. Entre em <https://supabase.com/dashboard>,
abra o projeto **SupportBox** e, se aparecer "Paused", clique em
**Restore project**.

### 2. Pegue a string de conexao

Dashboard > **Project Settings** > **Database** > **Connection string** >
aba **Session pooler**.

> **Use o "Session pooler", nao a "Direct connection".** A conexao direta
> so tem endereco IPv6; quem estiver numa rede sem IPv6 simplesmente nao
> conecta. O pooler funciona em qualquer rede.

O formato e:

```
postgresql://postgres.SEU_PROJETO:SENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres
```

A **SENHA** e a senha do banco — que **nao** e a mesma coisa que as chaves
de API. Se ninguem lembrar, troque em Settings > Database > **Reset
database password**.

### 3. Cole no `.env`

```
DATABASE_URL=postgresql://postgres.SEU_PROJETO:SENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres
```

O SSL liga sozinho: o `src/db.ts` percebe que o endereco nao e de rede
local e ativa a criptografia. Voce nao configura nada.

### 4. Crie as tabelas (so na primeira vez)

Dashboard > **SQL Editor** > **New query** > cole o conteudo de
`banco/schema.sql` > **Run**.

### 5. Suba e teste

```bash
npm run dev
```

Deve aparecer, alem do endereco do servidor:

```
[supportbox] banco: remoto, com SSL
```

### Quando voltar para o Postgres local

Troque **so a linha `DATABASE_URL`** do `.env`. Nenhum arquivo de codigo
muda. Isso nao e sorte: e o retorno de ter a persistencia isolada na
camada DAO e de usar o driver padrao do Postgres.

---

## Parte 1 — quem vai hospedar o banco

### 1.1 Instalar o PostgreSQL

Baixe em <https://www.postgresql.org/download/> e instale. Durante a
instalacao ele pede uma senha para o usuario `postgres` — **anote essa
senha**, ela vai ser usada nos proximos passos.

Precisa ser a **versao 13 ou mais nova**. Para conferir depois de instalar:

```bash
psql --version
```

> Se o comando `psql` nao for reconhecido no Windows, use o terminal
> "SQL Shell (psql)" que veio junto com o PostgreSQL, ou acrescente
> `C:\Program Files\PostgreSQL\17\bin` ao PATH do sistema.

### 1.2 Criar o usuario e o banco do projeto

Nao use o usuario `postgres` para a aplicacao: ele e administrador do
servidor inteiro. Crie um usuario so para o SupportBox.

Entre no psql como administrador:

```bash
psql -U postgres
```

E rode, uma linha por vez (troque `uma_senha_boa` por uma senha de verdade):

```sql
CREATE USER supportbox WITH PASSWORD 'uma_senha_boa';
CREATE DATABASE supportbox OWNER supportbox;
\q
```

### 1.3 Criar as tabelas

Ainda na pasta do backend:

```bash
psql -U supportbox -d supportbox -f banco/schema.sql
```

Para conferir se deu certo:

```bash
psql -U supportbox -d supportbox -c "\dt"
```

Devem aparecer as duas tabelas: `chamados` e `comentarios`.

### 1.4 Deixar o Postgres aceitar conexoes das outras maquinas

**Este e o passo que mais trava.** Por padrao, o Postgres so aceita conexoes
da propria maquina — de proposito, por seguranca. Sao dois arquivos.

Os dois ficam na pasta de dados, normalmente:
`C:\Program Files\PostgreSQL\17\data\`
(no Linux/Mac: `/etc/postgresql/17/main/` ou `/var/lib/pgsql/data/`)

**Arquivo 1 — `postgresql.conf`.** Procure a linha `listen_addresses`.
Ela vem comentada, com `#` na frente. Descomente e deixe assim:

```
listen_addresses = '*'
```

Isso quer dizer: "aceite conexoes chegando por qualquer placa de rede".

**Arquivo 2 — `pg_hba.conf`.** Este decide *quem* pode entrar. Acrescente
uma linha no fim do arquivo:

```
host    supportbox    supportbox    192.168.0.0/24    scram-sha-256
```

Lendo da esquerda para a direita: conexoes de rede (`host`), para o banco
`supportbox`, do usuario `supportbox`, vindas da faixa de IPs
`192.168.0.0/24` (a sua rede local), exigindo senha criptografada
(`scram-sha-256`).

> **Ajuste a faixa de IPs** para a da sua rede. Se o IP da sua maquina for
> `192.168.1.15`, a faixa e `192.168.1.0/24`. O `/24` significa "qualquer
> maquina cujo IP comece com esses tres primeiros numeros".
>
> **Nao use `0.0.0.0/0`.** Isso liberaria o banco para a internet inteira.

**Depois de editar os dois arquivos, reinicie o servico.** No Windows:
abra "Servicos", ache `postgresql-x64-17`, botao direito → Reiniciar.

### 1.5 Liberar a porta no firewall

O Windows bloqueia a porta 5432 por padrao. Abra o PowerShell **como
administrador** e rode:

```powershell
New-NetFirewallRule -DisplayName "PostgreSQL SupportBox" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

### 1.6 Descobrir e passar o seu IP

```powershell
ipconfig
```

Procure por "Endereco IPv4" (algo como `192.168.0.10`). **Passe esse numero
e a senha do usuario `supportbox` para o grupo** — e o que eles precisam.

---

## Parte 2 — todo mundo (inclusive quem hospeda)

### 2.1 Instalar as dependencias

```bash
npm install
```

### 2.2 Criar o `.env`

```bash
cp .env.example .env
```

Abra o `.env` e preencha a linha `DATABASE_URL`:

```
DATABASE_URL=postgresql://supportbox:uma_senha_boa@192.168.0.10:5432/supportbox
```

Trocando `192.168.0.10` pelo IP que a pessoa da Parte 1 passou, e
`uma_senha_boa` pela senha dela.

> **Quem hospeda o banco** pode escrever `localhost` no lugar do IP.

### 2.3 Subir o backend

```bash
npm run dev
```

Se aparecer `[supportbox-backend] http://localhost:4000`, deu certo.

### 2.4 Testar

```bash
curl http://localhost:4000/api/chamados -H "X-Usuario-Id: teste" -H "X-Usuario-Papel: agente"
```

A resposta esperada e `{"itens":[]}` — lista vazia, porque o banco esta
zerado. **Se voce viu isso, a migracao funcionou.**

---

## Quando der errado

| Mensagem | O que aconteceu | Como resolver |
|---|---|---|
| `Configuracao do banco ausente` | Falta a `DATABASE_URL` no `.env` | Passo 2.2 |
| `ECONNREFUSED` | Ninguem atendeu na porta 5432 | O Postgres esta parado, ou o `listen_addresses` nao foi ajustado (1.4) |
| `ETIMEDOUT` | O pedido saiu mas nao voltou | Firewall bloqueando (1.5), ou voces estao em redes diferentes |
| `no pg_hba.conf entry for host` | O Postgres atendeu e **recusou** | A faixa de IPs no `pg_hba.conf` nao cobre a sua maquina (1.4) |
| `password authentication failed` | Senha errada | Confira a senha na `DATABASE_URL`; se tiver `@` ou `:`, veja a nota no `.env.example` |
| `relation "chamados" does not exist` | Conectou, mas nao ha tabelas | Falta rodar o passo 1.3 |
| `permission denied for table` | Conectou no banco errado | Confirme que a URL termina em `/supportbox` |

**Teste rapido de rede.** De outra maquina, para saber se o problema e rede
ou banco:

```powershell
Test-NetConnection 192.168.0.10 -Port 5432
```

`TcpTestSucceeded : True` significa que a rede esta ok e o problema e de
autenticacao ou de banco. `False` significa firewall ou `listen_addresses`.

---

## O que muda no dia a dia do grupo

**O banco nao e mais compartilhado na nuvem.** Quando a maquina que hospeda
estiver desligada, **ninguem** consegue usar o sistema. Combinem os horarios,
ou cada um sobe um Postgres local para desenvolver sozinho — basta apontar a
`DATABASE_URL` para `localhost` e rodar o `schema.sql` na propria maquina.

**Os dados nao viajam junto com o codigo.** O `git pull` traz o `schema.sql`
atualizado, mas nao os chamados de teste que outra pessoa criou. Se alguem
mudar a estrutura de uma tabela, precisa avisar o grupo — e todos rodam o
SQL novo.

**Backup e por conta de voces.** O Supabase fazia sozinho; um Postgres local,
nao. Para guardar uma copia:

```bash
pg_dump -U supportbox supportbox > backup.sql
```
