// Calculo do prazo de resolucao (SLA, regra 6). Fica num arquivo proprio,
// sem banco e sem HTTP, para poder ser testado sozinho e usado pelo
// ChamadosService.

import type { Prioridade } from "../dominio";

// Quantos dias uteis cada prioridade tem para ser resolvida.
const DIAS_UTEIS: Record<Prioridade, number> = {
  alta: 1,
  media: 3,
  baixa: 5,
};

// Soma os dias uteis da prioridade a partir de `inicio`, um dia de cada vez,
// pulando sabado e domingo e mantendo o mesmo horario.
//   Exemplo: sexta 15h + 3 dias uteis (media) = quarta 15h
//
// Usa getDay/setDate (hora local), e nao as versoes UTC: uma sexta as 22h
// em Brasilia ja e sabado em UTC, e o calculo pularia o dia errado.
export function calcularPrazo(inicio: Date, prioridade: Prioridade): Date {
  // Trabalha numa copia: quem chamou continua com a data original intacta.
  const prazo = new Date(inicio.getTime());
  let faltam = DIAS_UTEIS[prioridade];

  while (faltam > 0) {
    prazo.setDate(prazo.getDate() + 1); // avanca um dia, mesma hora
    const diaDaSemana = prazo.getDay(); // 0 = domingo, 6 = sabado
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      faltam--; // so conta se for dia util
    }
  }

  return prazo;
}
