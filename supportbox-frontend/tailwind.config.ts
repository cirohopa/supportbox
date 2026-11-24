import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/views/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        marca: {
          DEFAULT: '#FF7000',
          hover: '#E66500',
          suave: '#FFF4EB',
          borda: '#FFD4B3',
          // Variantes da paleta anterior, ainda usadas pelas telas de login,
          // menu lateral, fila e janela de detalhes.
          forte: '#E66500',
          fraca: '#FFEDD5',
        },
        // Cores da paleta anterior (mantidas para as telas que ainda as usam).
        destaque: { DEFAULT: '#D97706', fraca: '#FEF3C7' },
        tinta: '#0F172A',
        tintaFraca: '#475569',
        linha: '#E2E8F0',
        papel: '#FFFFFF',
        fundo: '#F8FAFC',
        superficie: '#FFFFFF',
        borda: '#E2E8F0',
        texto: '#0F172A',
        textoSuave: '#64748B',
        sucesso: {
          DEFAULT: '#16A34A',
          fundo: '#F0FDF4',
          borda: '#BBF7D0',
        },
        atencao: {
          DEFAULT: '#D97706',
          fundo: '#FFFBEB',
          borda: '#FDE68A',
        },
        perigo: {
          DEFAULT: '#DC2626',
          fundo: '#FEF2F2',
          borda: '#FECACA',
        },
        info: {
          DEFAULT: '#2563EB',
          fundo: '#EFF6FF',
          borda: '#BFDBFE',
        },
      },
    },
  },
  plugins: [],
};

export default config;
