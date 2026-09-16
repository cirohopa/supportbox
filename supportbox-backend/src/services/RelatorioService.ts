// Regras de negocio dos relatorios. Nao sabe nada de HTTP nem de SQL.

import type { Ator, DadosRelatorio } from "../dominio";
import { RelatoriosDAO } from "../dao/RelatoriosDAO";
import { ErroAcessoNegado, ErroValidacao } from "../erros";

// Converte o texto "2026-09-01" em data. Se nao der, e erro de quem pediu.
function lerData(texto: unknown, campo: string): Date {
  const textoMontado = `${texto}T00:00:00`;
  const data = new Date(textoMontado);

  const numero = data.getTime();
  const deuErrado = Number.isNaN(numero);

  if (deuErrado) {
    throw new ErroValidacao(
      `Data "${campo}" invalida. Use o formato AAAA-MM-DD.`,
    );
  }

  return data;
}

export class RelatoriosService {
  constructor(private dao: RelatoriosDAO = new RelatoriosDAO()) {}

  async gerar(ator: Ator, de: unknown, ate: unknown): Promise<DadosRelatorio> {
    if (ator.papel !== "agente") {
      throw new ErroAcessoNegado("Apenas um agente pode ver relatorios.");
    }

    const inicio = lerData(de, "de");
    const fim = lerData(ate, "ate");

    if (inicio > fim) {
      throw new ErroValidacao(
        "A data inicial nao pode ser depois da data final.",
      );
    }

    // O banco compara com "menor que". Somando um dia, o ultimo dia
    // escolhido entra inteiro no relatorio.
    fim.setDate(fim.getDate() + 1);

    return this.dao.gerarRelatorio(inicio, fim);
  }
}
