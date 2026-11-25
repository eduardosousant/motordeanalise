import React, { useState } from 'react';
import { BadgeDollarSign, Home, FileText, Shield, Scale, PencilLine, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AppTheme } from '../types.js';

export type ActiveModule = 'TRIBUTACAO_ICMS' | 'ALUGUEL' | 'SERVICOS' | 'COMPARADOR_ORCAMENTOS' | 'EMAIL_ADIANTAMENTO';

interface SidebarProps {
    currentModule: ActiveModule;
    onSelectModule: (module: ActiveModule) => void;
    currentTheme?: AppTheme;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    currentModule,
                                                    onSelectModule,
                                                    currentTheme = 'GOV_CLASSIC'
                                                }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            const savedPreference = localStorage.getItem('auditoria-sidebar-collapsed');
            return savedPreference === null || savedPreference === 'true';
        } catch (error) {
            console.warn('Não foi possível carregar a preferência do menu lateral:', error);
            return true;
        }
    });

    const toggleCollapsed = () => {
        setIsCollapsed((collapsed) => {
            const nextCollapsed = !collapsed;
            try {
                localStorage.setItem('auditoria-sidebar-collapsed', String(nextCollapsed));
            } catch (error) {
                console.warn('Não foi possível salvar o estado do menu lateral:', error);
            }
            return nextCollapsed;
        });
    };

    const getSidebarTheme = () => {
        switch (currentTheme) {
            case 'INSTITUCIONAL':
                return {
                    asideBg: 'bg-slate-900 border-r border-slate-800 text-white',
                    headerBorder: 'border-slate-800',
                    iconBox: 'bg-teal-700 text-teal-200 border-teal-500/40',
                    brandTitle: 'text-slate-100',
                    brandSubtitle: 'text-teal-400',
                    sectionLabel: 'text-teal-400/80',
                    activeItem: 'bg-teal-700 text-white border-teal-500 shadow-sm font-semibold',
                    activeBadge: 'bg-teal-900 text-teal-200',
                    activeIcon: 'text-teal-200',
                    inactiveIcon: 'text-teal-500',
                    inactiveHover: 'hover:bg-slate-800/60 hover:text-white',
                    inactiveBadge: 'bg-slate-800 text-slate-300',
                    footerBorder: 'border-slate-800',
                    footerHighlight: 'text-teal-400'
                };
            case 'FINTECH_PRO':
                return {
                    asideBg: 'bg-slate-950 border-r border-indigo-950 text-white',
                    headerBorder: 'border-indigo-900/40',
                    iconBox: 'bg-indigo-600/40 text-sky-300 border-indigo-500/40',
                    brandTitle: 'text-white',
                    brandSubtitle: 'text-indigo-400',
                    sectionLabel: 'text-indigo-400/80',
                    activeItem: 'bg-indigo-600 text-white border-indigo-400 shadow-sm font-semibold shadow-indigo-900/30',
                    activeBadge: 'bg-indigo-950 text-sky-300',
                    activeIcon: 'text-sky-300',
                    inactiveIcon: 'text-indigo-400',
                    inactiveHover: 'hover:bg-slate-900/80 hover:text-white',
                    inactiveBadge: 'bg-slate-900 text-slate-400',
                    footerBorder: 'border-indigo-950',
                    footerHighlight: 'text-sky-400'
                };
            case 'DARK_AUDITOR':
                return {
                    asideBg: 'bg-[#070a11] border-r border-cyan-950/60 text-slate-100',
                    headerBorder: 'border-cyan-950/60',
                    iconBox: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                    brandTitle: 'text-slate-100',
                    brandSubtitle: 'text-cyan-400',
                    sectionLabel: 'text-cyan-400/80',
                    activeItem: 'bg-cyan-600 text-black border-cyan-400 shadow-sm font-bold',
                    activeBadge: 'bg-black text-cyan-300',
                    activeIcon: 'text-black',
                    inactiveIcon: 'text-cyan-400',
                    inactiveHover: 'hover:bg-slate-900/80 hover:text-slate-200',
                    inactiveBadge: 'bg-slate-900 text-slate-400',
                    footerBorder: 'border-cyan-950/60',
                    footerHighlight: 'text-cyan-400'
                };
            case 'GOV_CLASSIC':
            default:
                return {
                    asideBg: 'bg-[#092213] border-r border-emerald-950 text-white',
                    headerBorder: 'border-emerald-900/60',
                    iconBox: 'bg-emerald-800 text-amber-300 border-amber-400/30',
                    brandTitle: 'text-amber-100',
                    brandSubtitle: 'text-emerald-400',
                    sectionLabel: 'text-emerald-400/80',
                    activeItem: 'bg-emerald-900/90 text-amber-200 border-amber-400/40 shadow-sm font-semibold',
                    activeBadge: 'bg-amber-400/20 text-amber-200',
                    activeIcon: 'text-amber-300',
                    inactiveIcon: 'text-emerald-500',
                    inactiveHover: 'hover:bg-emerald-950/60 hover:text-white',
                    inactiveBadge: 'bg-emerald-950 text-emerald-400',
                    footerBorder: 'border-emerald-900/60',
                    footerHighlight: 'text-emerald-400'
                };
        }
    };

    const s = getSidebarTheme();

    const menuItems = [
        {
            id: 'TRIBUTACAO_ICMS' as ActiveModule,
            title: 'Motor de Tributação',
            subtitle: 'Aquisições de Bens e ICMS/MT',
            icon: BadgeDollarSign,
            badge: 'RICMS-MT'
        },
        {
            id: 'ALUGUEL' as ActiveModule,
            title: 'Aluguel Predial',
            subtitle: 'Retenções PF/PJ Vigência 2026',
            icon: Home,
            badge: 'Lei 15.270'
        },
        {
            id: 'SERVICOS' as ActiveModule,
            title: 'Notas de Serviços',
            subtitle: 'ISSQN e IN RFB 1.234/2012',
            icon: FileText,
            badge: 'Em Breve'
        },
        {
            id: 'COMPARADOR_ORCAMENTOS' as ActiveModule,
            title: 'Comparador de Orçamentos',
            subtitle: 'Análise & Art. 18-B LC 123/2006',
            icon: Scale,
            badge: 'Licitações'
        },
        {
            id: 'EMAIL_ADIANTAMENTO' as ActiveModule,
            title: 'Despacho de Adiantamento',
            subtitle: 'Orientação para faturamento e retenções',
            icon: PencilLine,
            badge: 'Financeiro'
        }
    ];

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} flex flex-col flex-shrink-0 min-h-screen transition-all duration-300 ${s.asideBg}`}>
            {/* Brand Header */}
            <div className={`p-3 border-b flex items-center ${isCollapsed ? 'flex-col gap-3' : 'justify-between gap-3'} ${s.headerBorder}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold border shadow-xs ${s.iconBox}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  {!isCollapsed && <div>
                    <h1 className={`text-xs font-bold uppercase tracking-wider ${s.brandTitle}`}>Auditoria Fiscal</h1>
                    <span className={`text-[10px] font-mono ${s.brandSubtitle}`}>Gestão & Retenções MT</span>
                  </div>}
                </div>
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                    aria-expanded={!isCollapsed}
                    title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                    className={`p-1.5 rounded-md text-slate-300 ${s.inactiveHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${isCollapsed ? '' : 'flex-shrink-0'}`}
                >
                    {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>
            </div>

            {/* Menu Options */}
            <nav className={`p-2 space-y-1.5 flex-1 ${isCollapsed ? 'items-center' : ''}`}>
                <span className={`text-[10px] font-mono uppercase px-2 font-bold tracking-widest block mb-2 ${s.sectionLabel} ${isCollapsed ? 'sr-only' : ''}`}>
                    Módulos do Sistema
                </span>

                {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentModule === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelectModule(item.id)}
                            aria-label={`${item.title}: ${item.subtitle}`}
                            title={isCollapsed ? `${item.title} — ${item.subtitle}` : undefined}
                            className={`w-full rounded-lg text-xs transition flex items-center cursor-pointer border ${
                                isCollapsed ? 'justify-center p-2.5' : 'justify-between p-2.5 text-left'
                            } ${
                                isActive
                                    ? s.activeItem
                                    : `text-slate-300 ${s.inactiveHover} border-transparent`
                            }`}
                        >
                            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? s.activeIcon : s.inactiveIcon}`} />
                                {!isCollapsed && <div>
                                    <div className="font-medium leading-tight">{item.title}</div>
                                    <div className="text-[10px] opacity-75">{item.subtitle}</div>
                                </div>}
                            </div>
                            {!isCollapsed && <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                isActive ? s.activeBadge : s.inactiveBadge
                            }`}>
                                {item.badge}
                            </span>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer da Sidebar */}
            <div className={`p-3 border-t text-[10px] text-slate-400 font-mono ${s.footerBorder} ${isCollapsed ? 'text-center' : ''}`}>
                {!isCollapsed && <>
                <div>SEFAZ-MT / IN RFB 1.234</div>
                <div className={s.footerHighlight}>Ambiente em Produção 2026</div>
                </>}
            </div>
        </aside>
    );
};