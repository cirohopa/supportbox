Li o roteiro e conferi as respostas no código do backend. A Parte 6 do roteiro já cobre o básico (Express/ORM, onde ficam as regras, por que PostgreSQL, os 1.000 chamados, testes, senhas e prazo), então **deixei essas de fora**. As perguntas abaixo são novas e vêm dos blocos do Ciro: slides 6 e 7, banco ao vivo e código do backend.

---

## 1. Arquitetura (slide 6)

**"Isso é MVC? Onde está o Model?"**
> Sim. A View é o frontend em Next.js e o Controller são os nossos Controllers. O Model foi dividido em duas camadas: o Service guarda as regras e o DAO cuida da persistência.

**"Qual a diferença entre o Controller e o Service, na prática?"**
> O Controller conhece HTTP: lê o token e o corpo e devolve o status. O Service não sabe o que é HTTP. Por isso o Telegram consegue chamar o mesmo Service sem passar pelo navegador.

**"Como o Service avisa o Controller que deu erro?"**
> Ele lança erros de domínio, como ErroValidacao ou ErroAcessoNegado ([erros.ts](supportbox-backend/src/erros.ts)). Uma única função traduz cada um no status HTTP certo (400, 401, 403 ou 404). Um erro que ninguém previu vira 500, com mensagem genérica, para não vazar detalhes internos.

**"Sem Express, como vocês fazem o roteamento?"**
> A tabela de rotas em [routes/index.ts](supportbox-backend/src/routes/index.ts) transforma cada caminho, como `/api/chamados/:id`, em uma expressão regular. Isso acontece uma vez só, quando o servidor liga. A cada requisição, o [app.ts](supportbox-backend/src/app.ts) procura a primeira rota que casa com o método e o caminho. Se nenhuma casar, responde 404.

**"O que é CORS e por que vocês trataram o método OPTIONS?"**
> O frontend roda na porta 3000 e o backend na 4000. Sem os cabeçalhos de CORS, o navegador bloqueia a chamada. Antes de um POST ou PATCH com JSON, o navegador manda um OPTIONS perguntando se pode fazer a chamada, e nós respondemos 204.

**"`POST /chamados/:id/assumir` é REST de verdade?"**
> Não é REST puro, porque usa um verbo na URL. Foi de propósito: assumir, concluir e reabrir são ações com regra própria, e não só uma troca de campo. Para alterar um campo usamos PATCH, como na prioridade.

## 2. Banco de dados (demo e DAO)

**"Por que o `agente_id` guarda o e-mail, e não uma chave estrangeira para `usuarios`?"** ⚠️
> Foi uma decisão consciente, que está comentada no [schema.sql:73-78](supportbox-backend/banco/schema.sql#L73-L78). Os chamados antigos não precisaram ser migrados, e o Telegram identifica o agente pelo e-mail. O custo é que o banco não garante que o e-mail existe. Se o e-mail mudar, o histórico fica órfão. O correto seria usar o `id` com REFERENCES.

**"Como o protocolo é gerado? E se dois chamados forem abertos no mesmo instante?"** ⚠️ *(muito provável)*
> O protocolo é a contagem de chamados do ano mais um ([ChamadosDAO.ts:282](supportbox-backend/src/dao/ChamadosDAO.ts#L282)). Se dois chamados forem abertos ao mesmo tempo, os dois calculam o mesmo número, e a coluna é UNIQUE. O banco recusa o segundo, que recebe erro e precisa ser enviado de novo. Nada fica duplicado, mas a solução certa é uma SEQUENCE do PostgreSQL.

**"E se dois agentes clicarem em Assumir ao mesmo tempo?"** ⚠️
> O Service lê o chamado, confere se está "aberto" e depois grava. Entre ler e gravar, o outro agente pode ter assumido, e quem gravar por último fica com o chamado. A correção seria colocar a condição no próprio UPDATE (`WHERE status = 'aberto'`) e conferir se alguma linha foi alterada.

**"Vocês usam transação?"** ⚠️
> Ainda não. Ao assumir um chamado, o sistema faz um UPDATE no chamado e um INSERT no histórico, que são duas consultas separadas. Se a segunda falhar, o chamado muda sem o registro no histórico. A correção é pegar uma conexão do pool e envolver as duas consultas em BEGIN e COMMIT.

**"A listagem do solicitante filtra no banco?"** ⚠️
> Não. O DAO traz todos os chamados e o Service filtra os do solicitante ([ChamadosService.ts:111](supportbox-backend/src/services/ChamadosService.ts#L111)). Escolhemos assim para deixar a regra em um lugar só. Com volume grande, o certo é um método no DAO com `WHERE solicitante_id = $1`, e isso tem a ver com aquela meta dos 1.000 chamados.

**"Como vocês se protegem de SQL injection?"**
> Os valores nunca são colados no texto do SQL. Eles vão como parâmetros (`$1`, `$2`), e o PostgreSQL os trata sempre como dado, nunca como comando. Isso está em um lugar só, no [db.ts](supportbox-backend/src/db.ts).

**"Por que UUID como chave, se vocês já têm o protocolo?"**
> O UUID é a chave interna: não dá para adivinhar e não depende de contagem. O protocolo é para as pessoas lerem. Separar os dois deixa mudar o formato do protocolo sem mexer em nenhuma ligação entre tabelas.

**"Por que `timestamptz`?"**
> Porque guarda o fuso junto com a data. Sem isso, o prazo de 7 dias para reabrir e o SLA poderiam sair errados para quem está em outro fuso.

**"O histórico é imutável no banco também, ou só na aplicação?"**
> Só na aplicação: não existe rota, método nem DAO para editar ou apagar comentário. Quem tiver acesso direto ao banco consegue mudar. Para reforçar no banco, daria para tirar a permissão de UPDATE e DELETE dessa tabela ou criar um trigger que recuse alterações.

**"O `ON DELETE CASCADE` não contradiz a ideia de histórico permanente?"**
> O sistema não tem como apagar chamado: não existe rota para isso. O CASCADE só evita comentário órfão caso alguém apague o chamado direto no banco.

**"Por que o relatório é calculado em SQL, e não em JavaScript?"**
> O banco agrega muito mais rápido e devolve só o resultado, em vez de mandar todas as linhas para o Node. As quatro consultas rodam em paralelo, com `Promise.all`.

**"Para que serve o `::int` no COUNT?"**
> O COUNT devolve bigint, e a biblioteca `pg` entrega isso como texto. Sem a conversão, "7" + 1 viraria "71".

**"Como vocês mudam a estrutura do banco?"**
> Com scripts SQL manuais: o `schema.sql` usa IF NOT EXISTS e existe uma `migracao-novembro.sql`. Ainda não temos uma ferramenta de migração com controle de versão.

## 3. Tecnologias e infraestrutura (slide 7)

**"O que é o pool de conexões e por que o máximo é 10?"**
> Abrir uma conexão por requisição é lento. O pool mantém conexões abertas e empresta conforme a necessidade. O número 10 é o padrão da biblioteca e basta para uso local; em produção ele seria ajustado depois de um teste de carga.

**"Onde ficam as senhas e chaves?"**
> No `.env`, que está fora do Git. Existe um `.env.example` sem valores. Se faltar o DATABASE_URL, o SESSAO_SEGREDO ou a chave do Gemini, o backend nem liga.

**"Como vocês publicariam isso?"**
> Um PostgreSQL gerenciado, o backend em um serviço de Node com as variáveis de ambiente, e o frontend separado. O bot do Telegram passaria a receber as mensagens por webhook, que precisa de endereço público.

**"O backend tem alguma proteção contra requisições muito grandes ou em excesso?"** ⚠️
> Ainda não: não há limite de tamanho do corpo nem de requisições por usuário. É uma das coisas que um framework entrega pronto e que nós teríamos que implementar.

**"Por que o token é assinado e não guardado no banco? Por que não usaram JWT?"**
> É a mesma ideia do JWT, feita à mão com HMAC do módulo crypto do Node. A vantagem é não consultar o banco a cada requisição. A desvantagem é que sair do sistema não invalida o token (já está na Parte 6).

---

## Pontos de atenção para o Ciro

As perguntas marcadas com ⚠️ apontam limitações reais do código:
- o protocolo gerado pela contagem;
- dois agentes assumindo o mesmo chamado ao mesmo tempo;
- a falta de transação;
- o filtro da listagem feito em memória;
- o e-mail usado no lugar de chave estrangeira;
- a falta de limite de requisições.

Uma banca técnica costuma ir exatamente nelas. A estratégia é a mesma do roteiro: **reconhecer a limitação e dizer em uma frase como resolveria.**

Um cuidado com o roteiro: a fala *"as consultas principais têm índices"* (Parte 6) é verdadeira só em parte. Existem índices em `criado_em`, no protocolo (que é UNIQUE) e nos comentários. O relatório filtra por `concluido_em`, que não tem índice. Se perguntarem, isso precisa estar claro.

Também notei que o comentário em [routes/index.ts:55](supportbox-backend/src/routes/index.ts#L55) diz que a autenticação "ainda responde 501", o que está desatualizado. Se a banca pedir para ver esse arquivo, vale apagar o comentário antes.

Se quiser, posso acrescentar essas perguntas como uma nova seção da Parte 6 do roteiro.