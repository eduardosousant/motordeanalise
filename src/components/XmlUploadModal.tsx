import React, { useRef, useState } from 'react';
import { parseNfeXml } from '../lib/nfeXmlParser';
import { OperacaoComercial } from '../types';

interface XmlUploadProps {
    onXmlParsed: (operacao: OperacaoComercial) => void;
}

export const XmlUploadButton: React.FC<XmlUploadProps> = ({ onXmlParsed }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [erro, setErro] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const operacao = parseNfeXml(content);
                setErro(null);
                onXmlParsed(operacao);
            } catch (err: any) {
                setErro(err.message || 'Erro ao processar o XML da NF-e.');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reseta input
    };

    return (
        <div className="inline-block">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xml"
                className="hidden"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Importar XML da NF-e
            </button>
            {erro && <span className="block text-xs text-red-500 mt-1">{erro}</span>}
        </div>
    );
};