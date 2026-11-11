// Erros que a camada Service lanca quando uma acao nao pode acontecer.
// Sao classes separadas para o Controller diferenciar cada caso com
// `instanceof` e escolher o status HTTP - ver `responderErro` em utils/http.ts.

export class ErroValidacao extends Error {}      // vira 400
export class ErroNaoEncontrado extends Error {}  // vira 404
export class ErroAcessoNegado extends Error {}   // vira 403
export class ErroNaoAutenticado extends Error {} // vira 401
