// Ponto de entrada do backend: carrega o .env e sobe o servidor HTTP.
// Sem framework (Express e afins) - so o modulo `http` nativo do Node.

// PRECISA ser o primeiro import: os modulos carregados depois (db.ts, ia.ts)
// leem process.env assim que sao importados.
import "dotenv/config";
import { createServer } from "http";
import { criarManipulador } from "./app";

const PORTA = Number(process.env.PORT ?? 4000);

createServer(criarManipulador()).listen(PORTA, () => {
  console.log(`[supportbox-backend] http://localhost:${PORTA}`);
});
