interface PropsMoldeCartaoDados {
  /** Texto pequeno no topo do cartão, em maiúsculas. */
  rotulo: string;
  /** O valor exibido em destaque. Aceita texto (ex.: "18h", "-") além de números. */
  valor: string | number;
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
