import React, { useEffect, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { buscarNcms, NcmSearchResult } from '../data/ncmDatabase.js';

interface NcmSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: NcmSearchResult) => void;
}

export const NcmSearchModal: React.FC<NcmSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<NcmSearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTermo('');
    setResultados([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setResultados(buscarNcms(termo));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ncm-search-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(680px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 id="ncm-search-title" className="text-base font-bold text-slate-900">
              Localizar código NCM
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Pesquise por código ou descrição da mercadoria.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar busca de NCM"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 border-b border-slate-100 p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Ex.: 3209.10.00 ou tinta acrílica"
              minLength={2}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <button
            type="submit"
            disabled={termo.trim().length < 2}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pesquisar
          </button>
        </form>

        <div className="min-h-0 overflow-y-auto">
          {resultados.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              {termo ? 'Nenhum NCM encontrado para essa busca.' : 'Digite ao menos 2 caracteres e pesquise.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {resultados.map((item) => (
                <button
                  key={item.codigo}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-emerald-50"
                >
                  <span className="w-28 shrink-0 font-mono text-sm font-bold text-emerald-800">
                    {item.codigo.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3')}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-slate-700">{item.descricao}</span>
                  {item.statusSt === 'ST' && (
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-800 sm:flex">
                      <Check className="h-3 w-3" /> ST
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
