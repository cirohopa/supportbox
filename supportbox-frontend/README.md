# SupportBox

Sistema interno de atendimento de TI.

> Estado atual: as telas estão **ligadas ao backend** (projeto
> `supportbox-backend`). Login, abertura, listagem, detalhes, assumir,
> concluir e comentar já passam pela API real. A autenticação ainda é
> temporária (sem validação de senha) — veja a seção "Como rodar".

## 1. O que faz

O SupportBox permite abrir e acompanhar chamados de TI. Há dois tipos
de usuário:

| Quem é      | O que pode fazer                                             |
| ----------- | ------------------------------------------------------------ |
| Solicitante | Abrir chamados, ver os próprios chamados, comentar.          |
| Agente      | Ver todos os chamados, filtrar, assumir, concluir, comentar. |

As telas consomem a API do backend (`supportbox-backend`): os dados são
reais e as regras de negócio (quem pode assumir, concluir, comentar, etc.)
são aplicadas lá. O que ainda é provisório é o acesso: não há validação de
senha — a identidade vem do e-mail informado no login (veja abaixo).

## 2. Como rodar

O frontend conversa com o backend, então **os dois precisam estar no ar**.

**1) Suba o backend** (no projeto `supportbox-backend`):

```
npm install
npm run dev     # API em http://localhost:4000
```

**2) Suba o frontend** (neste projeto):

```
npm install
npm run dev     # telas em http://localhost:3000
```

O endereço da API fica em `.env.local` (`NEXT_PUBLIC_API_URL`, padrão
`http://localhost:4000`). Pré-requisito: Node.js 18 ou mais novo.

### Como entrar (login temporário)

Ainda não há autenticação real: a **senha é ignorada** e o e-mail vira a
sua identidade. O papel é decidido pelo e-mail:

- e-mail com a palavra **"agente"** (ex.: `marcos.agente@empresa.com`) →
  painel do agente;
- qualquer outro e-mail (ex.: `joana@empresa.com`) → portal do solicitante.

Dica para ver o fluxo completo: abra um chamado como solicitante numa aba
e, em outra aba (ou janela anônima), entre como agente para assumir,
comentar e concluir esse mesmo chamado.



## 3. Como o projeto está organizado:

O sistema segue a arquitetura em camadas, orientado ao padrão de desenvolvimento MVC. Sendo:
View - Elementos de Tela;
Controller - Conecta as requisições da View até a Camada de Serviço;
Service Layer - Valida regras de negócio;
Model - Persistência de Dados.

A camada **View** vive aqui (`src/views`). As demais — Controller, Service
e persistência (Model) — ficam no projeto `supportbox-backend`, que o
frontend agora consome pela API (`src/lib`).


### Princípios usados:

Cada componente segue alguns princípios do SOLID:

- Responsabilidade Única (SRP): cada componente tem um papel claro.
  O botão é botão, o formulário coleta dados, a tabela exibe. Ninguém
  acumula funções.
- Aberto/Fechado (OCP): é possível "estender" sem mexer no que já existe.
  Para adicionar uma nova variante de botão, basta registrar uma chave
  nova, sem precisar alterar a lógica.
- Inversão de Dependência (DIP): os componentes não buscam dados
  por conta própria, recebem listas e funções via argumentos. Assim, a
  origem dos dados pode mudar sem impactar a camada visual.


## 4. Raiz do Projeto:

```
├── src/
│   ├── app/                                 rotas do site
│   │   ├── agente/
│   │   │   ├── layout.tsx                   coloca a barra lateral fixa
│   │   │   └── page.tsx                     /agente
│   │   ├── login/
│   │   │   └── page.tsx                     /login (tela de entrada)
│   │   ├── solicitante/
│   │   │   ├── layout.tsx                   envolve as telas do solicitante
│   │   │   └── page.tsx                     /solicitante
│   │   ├── globals.css                      estilos gerais e diretivas do Tailwind
│   │   ├── layout.tsx                       moldura raiz com html e body
│   │   └── page.tsx                         rota inicial, redireciona para /login
│   │
│   ├── views/                               componentes que formam as telas
│   │   ├── agente/
│   │   │   ├── BarraFiltros.tsx             busca e abas de situação de Tickets
│   │   │   ├── MenuLateralAgente.tsx        barra lateral do agente
│   │   │   ├── PainelAgente.tsx             monta a tela do agente
│   │   │   └── TabelaChamados.tsx           tabela de chamados
│   │   │
│   │   ├── auth/
│   │   │   └── FormularioLogin.tsx          coleta e-mail e senha para login
│   │   │
│   │   ├── compartilhado/                   elementos em comum usados por todas as telas do sistema (botões, faixas, campos...)
│   │   │   ├── Botao.tsx                    botão padrão
│   │   │   ├── Cabecalho.tsx                faixa superior do solicitante
│   │   │   ├── CampoSelect.tsx              campo de seleção
│   │   │   ├── CampoTexto.tsx               campo de uma linha
│   │   │   ├── CampoTextoArea.tsx           campo de várias linhas
│   │   │   ├── Etiqueta.tsx                 marcação colorida
│   │   │   ├── ModalDetalhesChamado.tsx     janela de detalhes do chamado
│   │   │   └── tipos-view.ts                formatos de dados das telas
│   │   │
│   │   └── solicitante/
│   │       ├── FormularioAberturaChamado.tsx  formulário de abertura de chamado
│   │       ├── ListaMeusChamados.tsx          lista dos chamados do solicitante
│   │       └── PainelSolicitante.tsx          monta a tela do solicitante
│   │
│   ├── lib/                                 conversa com o backend (sem visual)
│   │   ├── api.ts                           cliente HTTP da API
│   │   ├── mapeamento.ts                    traduz dados do backend p/ as telas
│   │   └── sessao.ts                        sessão autenticada e token (localStorage)
│   └── css.d.ts                             declaração de tipo para CSS global
│
├── .env.local.example    -> modelo do .env.local (endereço da API)
├── next.config.mjs       -> ajustes do Next.js
├── package.json          -> dependências e atalhos
├── postcss.config.mjs    -> PostCSS, que alimenta o Tailwind
├── README.md             -> este arquivo
├── tailwind.config.ts    -> paleta de cores utilizadas nas páginas
└── tsconfig.json         -> configuração do TypeScript
```

### Por que duas pastas, `src/app` e `src/views`?

A pasta `src/app` existe porque o Next.js exige. É lá que ficam as
rotas do site. Os arquivos dela são bem curtos: cada um importa um
componente da pasta `src/views`, passa as informações necessárias e
desenha.

A pasta `src/views` é onde a interface visual de fato vive. É a
parte que pode ser reaproveitada se um dia o time mudar de
ferramenta.

## 5. Como os dados fluem

```
src/app/.../page.tsx  →  src/lib/api.ts  →  backend (API)
   (busca os dados)         (faz o fetch)     (regras + dados)
        |
        v
   src/views/...  (mostram a tela; recebem dados e ações por props)
```

A página (casca da rota) busca os dados pela API, traduz com
`src/lib/mapeamento.ts` e passa as listas e as ações para os componentes
visuais. Os componentes continuam sem buscar nada por conta própria.

## 6. Convenções:

- Cada arquivo começa com um comentário curto explicando o que ele
  faz. Mantenha esse padrão ao criar arquivos novos.
- A aparência usa o Tailwind com cores semânticas como `marca`,
  `cor` e `linha`, definidas em `tailwind.config.ts`. Evite
  códigos de cor direto no componente.
- Os componentes guardam apenas estado de tela, como qual janela
  está aberta. Tudo que mexe com os dados será responsabilidade da
  camada de regras.

## 7. O que vem pela frente:

- [x] Primeira etapa: telas e componentes reaproveitáveis.
- [x] Segunda etapa: integração com o backend — criar, listar, detalhar,
      assumir, concluir e comentar pela API real.
- [x] Terceira etapa: persistência em banco de verdade — o backend grava em
      **PostgreSQL** (veja `banco/COMO_RODAR.md` no projeto do backend).
- [ ] Quarta etapa: autenticação real (login/senha) no lugar do acesso
      temporário por e-mail.
- [ ] Quinta etapa: triagem automática por IA na abertura.

## 8. Ferramentas usadas:

| Ferramenta   | Para que serve                                             |
| ------------ | ---------------------------------------------------------- |
| Next.js 15   | Ferramenta de páginas em React, com rotas e renderização.  |
| React 19     | Biblioteca usada para montar as telas.                     |
| TypeScript   | Tipagem que ajuda a pegar erros antes de rodar.            |
| Tailwind CSS | Estilo aplicado por classes prontas, com paleta semântica. |
| lucide-react | Conjunto de ícones em SVG, leves, usados em toda a tela.   |

```

```
