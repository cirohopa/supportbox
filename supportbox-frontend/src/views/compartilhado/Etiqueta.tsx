import React from 'react';

export interface PropsEtiqueta {
  tipo: 'situacao' | 'prioridade';
  valor: string;
}

export default function Etiqueta({ tipo, valor }: PropsEtiqueta) {
  const chave = valor?.toLowerCase().trim();

  const mapaEstilos: Record<string, { texto: string; classe: string; ponto: string }> = {
    aberto: {
      texto: 'Aberto',
      classe: 'bg-info-fundo text-info border-info-borda',
      ponto: 'bg-info',
    },
    em_andamento: {
      texto: 'Em andamento',
      classe: 'bg-atencao-fundo text-atencao border-atencao-borda',
      ponto: 'bg-atencao',
    },
    concluido: {
      texto: 'Concluído',
      classe: 'bg-sucesso-fundo text-sucesso border-sucesso-borda',
      ponto: 'bg-sucesso',
    },
    baixa: {
      texto: 'Baixa',
      classe: 'bg-slate-100 text-slate-700 border-slate-200',
      ponto: 'bg-slate-500',
    },
    media: {
      texto: 'Média',
      classe: 'bg-atencao-fundo text-atencao border-atencao-borda',
      ponto: 'bg-atencao',
    },
    alta: {
      texto: 'Alta',
      classe: 'bg-perigo-fundo text-perigo border-perigo-borda',
      ponto: 'bg-perigo',
    },
  };

  const config = mapaEstilos[chave] || {
    texto: valor || '-',
    classe: 'bg-slate-100 text-slate-700 border-slate-200',
    ponto: 'bg-slate-400',
  };

  return (
    <span
      title={`${tipo === 'situacao' ? 'Situação' : 'Prioridade'}: ${config.texto}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classe}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.ponto}`} />
      {config.texto}
    </span>
  );
}
