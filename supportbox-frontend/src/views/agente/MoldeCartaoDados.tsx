interface PropsMoldeCartaoDados {
  /** Texto pequeno no topo do cartão, em maiúsculas. */
  rotulo: string;
  /** O número exibido em destaque. */
  valor: number;
}

export function MoldeCartaoDados({ rotulo, valor }: PropsMoldeCartaoDados) {
  return (
    <div className="bg-papel border border-linha rounded-md p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-tintaFraca">
        {rotulo}
      </p>
      <p className="text-3xl font-semibold text-tinta mt-2">{valor}</p>
    </div>
  );
}
