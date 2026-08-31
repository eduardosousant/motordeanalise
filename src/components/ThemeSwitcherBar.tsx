import React from 'react';
import { Palette, Sparkles, Moon, Building2, Landmark, Check } from 'lucide-react';
import { AppTheme } from '../types.js';

interface ThemeSwitcherBarProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const THEME_OPTIONS: {
  id: AppTheme;
  name: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: string[];
}[] = [
  {
    id: 'INSTITUCIONAL',
    name: 'Institucional Executivo',
    badge: 'Padrão Corporativo',
    desc: 'Azul-marinho sóbrio, ardósia, esmeralda e tipografia fiscal de alta legibilidade.',
    icon: Building2,
    colors: ['#0f172a', '#0d9488', '#10b981', '#f8fafc']
  },
  {
    id: 'FINTECH_PRO',
    name: 'Fintech Pro / Linear',
    badge: 'Moderno & Limpo',
    desc: 'Cartões flutuantes, tons índigo/ciano, bordas sutis e estética minimalista Stripe.',
    icon: Sparkles,
    colors: ['#4f46e5', '#0284c7', '#38bdf8', '#ffffff']
  },
  {
    id: 'DARK_AUDITOR',
    name: 'Dark Auditor',
    badge: 'Modo Escuro Pro',
    desc: 'Grafite profundo (#0b0f19), alto contraste, luzes neon e sem cansaço visual.',
    icon: Moon,
    colors: ['#0b0f19', '#1e293b', '#38bdf8', '#10b981']
  },
  {
    id: 'GOV_CLASSIC',
    name: 'Governo MT Oficial',
    badge: 'Estadual MT',
    desc: 'Cores cívicas do Estado de MT (Verde Bandeira, Dourado e Branco Institucional).',
    icon: Landmark,
    colors: ['#14532d', '#15803d', '#eab308', '#f8fafc']
  }
];

export const ThemeSwitcherBar: React.FC<ThemeSwitcherBarProps> = ({ currentTheme, onSelectTheme }) => {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm mb-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-lg">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Prévia & Seletor de Estilos de Design</span>
              <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] rounded font-mono font-semibold">4 Temas em Tempo Real</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clique em qualquer estilo abaixo para testar e transformar o visual do sistema instantaneamente:
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {THEME_OPTIONS.map((theme) => {
          const isSelected = currentTheme === theme.id;
          const Icon = theme.icon;

          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-teal-500/50'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/90 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300'
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isSelected
                        ? 'bg-teal-500 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-2xs'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">{theme.name}</h4>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider ${
                        isSelected ? 'text-teal-300' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {theme.badge}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Descrição */}
              <p
                className={`text-[10px] leading-relaxed mb-2.5 line-clamp-2 ${
                  isSelected ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {theme.desc}
              </p>

              {/* Paleta de Cores */}
              <div className="flex items-center gap-1 mt-auto pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                <span className="text-[9px] font-mono text-slate-400 mr-1">Paleta:</span>
                {theme.colors.map((c, idx) => (
                  <span
                    key={idx}
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
