// Menu lateral do agente de suporte - contém 3 atalhos de navegação (Tickets, Painel de Dados e Relatórios)
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, BarChart2, FileText } from 'lucide-react';

export default function MenuLateralAgente() {
  const caminho = usePathname();

  const emTickets = caminho === '/agente' || caminho.startsWith('/agente/tickets');
  const emDados = caminho === '/agente/dados';
  const emRelatorios = caminho === '/agente/relatorios';

  return (
    <aside className="w-64 bg-fundoCard border-r border-borda h-screen p-4 flex flex-col gap-2">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-bold text-tinta">SupportBox</h2>
        <p className="text-xs text-tintaFraca">Área do agente</p>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/agente"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            emTickets ? 'bg-marca text-white' : 'text-tinta hover:bg-fundo'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Tickets</span>
        </Link>

        <Link
          href="/agente/dados"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            emDados ? 'bg-marca text-white' : 'text-tinta hover:bg-fundo'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Painel de Dados</span>
        </Link>

        <Link
          href="/agente/relatorios"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            emRelatorios ? 'bg-marca text-white' : 'text-tinta hover:bg-fundo'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Relatórios</span>
        </Link>
      </nav>
    </aside>
  );
}
