import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Sparkles, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  Database, 
  ShieldCheck, 
  Key,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  FileText
} from 'lucide-react';
import { EconodataStatus } from '../types';

interface HeaderProps {
  econodataStatus: EconodataStatus | null;
  isLoadingEconodata: boolean;
  isProcessingPipeline: boolean;
  onOpenEconodataInfo: () => void;
  onRunUnifiedPipeline: () => void;
  onExportConsolidatedXLSX: () => void;
  onExportEnrichedCompaniesXLSX: () => void;
  onExportEmpresaCnpjXLSX: () => void;
  onExportParticipantsCSV: () => void;
  onResetSampleData: () => void;
  totalRecords: number;
}

export const Header: React.FC<HeaderProps> = ({
  econodataStatus,
  isLoadingEconodata,
  isProcessingPipeline,
  onOpenEconodataInfo,
  onRunUnifiedPipeline,
  onExportConsolidatedXLSX,
  onExportEnrichedCompaniesXLSX,
  onExportEmpresaCnpjXLSX,
  onExportParticipantsCSV,
  onResetSampleData,
  totalRecords,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#162927] text-white border-b border-[#2C3F3D] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#C89439] flex items-center justify-center text-[#162927] shadow-inner font-black text-2xl tracking-tighter">
              <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-[#C89439]/20 text-[#E5B55E] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#C89439]/30 uppercase tracking-wider">
                  ACESU • 6º Fórum
                </span>
                <span className="text-xs text-[#9EB2AF]">Prevenção de Perdas</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display uppercase">
                Painel Unificado ACESU + Econodata
              </h1>
              <p className="text-xs text-[#B8CAC7] mt-0.5">
                ETL Executivo, Classificação Hierárquica, Validação CNPJ Módulo 11 e Enriquecimento Fiscal/Financeiro
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Econodata Status Pill */}
            <button
              id="econodata-status-btn"
              onClick={onOpenEconodataInfo}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                econodataStatus?.configured
                  ? 'bg-[#1D3B38] border-[#36635F] text-[#86E3CE] hover:bg-[#254C48]'
                  : 'bg-[#2A2D2C] border-[#444A48] text-[#E0B259] hover:bg-[#343836]'
              }`}
              title="Clique para ver o status da conexão com a Econodata"
            >
              <Database className="w-4 h-4" />
              <span>
                {isLoadingEconodata
                  ? 'Verificando Econodata...'
                  : econodataStatus?.configured
                  ? `Econodata Ativa (${econodataStatus.balance ?? 'Conectada'})`
                  : 'Econodata: Chave Pendente'}
              </span>
              {econodataStatus?.configured ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Key className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Run Unified Pipeline */}
            <button
              id="run-pipeline-btn"
              onClick={onRunUnifiedPipeline}
              disabled={isProcessingPipeline || totalRecords === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                isProcessingPipeline
                  ? 'bg-[#738F8B] text-white cursor-not-allowed'
                  : 'bg-[#C89439] hover:bg-[#DEAB4B] text-[#162927] hover:shadow'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isProcessingPipeline ? 'animate-spin' : ''}`} />
              <span>{isProcessingPipeline ? 'Processando Base...' : 'Executar Enriquecimento'}</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="export-dropdown-btn"
                onClick={() => setShowExportMenu((prev) => !prev)}
                disabled={totalRecords === 0}
                className="flex items-center space-x-2 bg-[#2C4A46] hover:bg-[#385E59] text-white px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#3E6862] transition-colors disabled:opacity-50"
                title="Opções de exportação de dados"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#86E3CE]" />
                <span>Exportar Relatórios</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9EB2AF]" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1B3230] border border-[#36635F] rounded-xl shadow-2xl z-50 py-1 text-xs text-white">
                  <button
                    id="export-7tabs-btn"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportConsolidatedXLSX();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#254C48] flex items-start space-x-2.5 transition-colors border-b border-[#2C4A46]"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#86E3CE] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Consolidado Completo (7 Abas)</div>
                      <div className="text-[10px] text-[#9EB2AF]">
                        XLSX com Participantes, Empresas, Cargos, Geografia e Métricas
                      </div>
                    </div>
                  </button>

                  <button
                    id="export-empresas-btn"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportEnrichedCompaniesXLSX();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#254C48] flex items-start space-x-2.5 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-[#E5B55E] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Empresas Enriquecidas (.xlsx)</div>
                      <div className="text-[10px] text-[#9EB2AF]">Dados Econodata, porte e faturamento</div>
                    </div>
                  </button>

                  <button
                    id="export-cnpj-compact-btn"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportEmpresaCnpjXLSX();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#254C48] flex items-start space-x-2.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#A8DADC] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Empresa & CNPJ Compacto (.xlsx)</div>
                      <div className="text-[10px] text-[#9EB2AF]">Tabela direta de de/para CNPJ</div>
                    </div>
                  </button>

                  <button
                    id="export-csv-btn"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportParticipantsCSV();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#254C48] flex items-start space-x-2.5 transition-colors border-t border-[#2C4A46]"
                  >
                    <Download className="w-4 h-4 text-[#86E3CE] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Participantes (.csv)</div>
                      <div className="text-[10px] text-[#9EB2AF]">Exportação formato delimitado por ';'</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Reset / Reload Sample */}
            <button
              id="reset-sample-btn"
              onClick={onResetSampleData}
              className="p-2 text-[#9EB2AF] hover:text-white bg-[#1D3B38] hover:bg-[#254C48] border border-[#2F534F] rounded-lg transition-colors"
              title="Restaurar dados de exemplo do 6º Fórum"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

