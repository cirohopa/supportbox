// Regras de negocio dos relatorios. Nao sabe nada de HTTP nem de SQL.

import type { Ator, DadosRelatorio } from "../dominio";
import { RelatoriosDAO } from "../dao/RelatoriosDAO";
import { ErroAcessoNegado, ErroValidacao } from "../erros";

export class RelatoriosService {
  constructor(private dao: RelatoriosDAO = new RelatoriosDAO()) {}

  async gerar(ator: Ator, de: unknown, ate: unknown): Promise<DadosRelatorio> {
    if (ator.papel !== "agente") {
      throw new ErroAcessoNegado("Apenas um agente pode ver relatorios.");
    }

    // O "T00:00:00" fixa meia-noite no horario local. Sem ele o JavaScript
    // usaria o horario de Londres, e a data cairia no dia anterior.
    const inicio = new Date(`${de}T00:00:00`);
    const fim = new Date(`${ate}T00:00:00`);

    if (inicio > fim) {
      throw new ErroValidacao(
        "A data inicial nao pode ser depois da data final.",
      );
    }

    // O banco compara com "menor que". Somando um dia, o ultimo dia
    // escolhido entra inteiro no relatorio.
    fim.setDate(fim.getDate() + 1);

    return this.dao.gerarRelatorioAtendimentos(inicio, fim);
  }
}
