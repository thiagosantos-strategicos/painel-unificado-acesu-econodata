import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  LayoutGrid, 
  ShieldCheck, 
  Upload, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ParticipantRecord, EnrichedCompany, EconodataStatus, PipelineSummary } from './types';
import { INITIAL_SAMPLE_PARTICIPANTS } from './utils/sampleData';
import { 
  consolidateCompanies, 
  exportWorkbookXLSX, 
  exportEnrichedCompaniesXLSX, 
  exportEmpresaCnpjXLSX, 
  exportSingleCSV 
} from './utils/exportUtils';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { EnrichedCompaniesTable } from './components/EnrichedCompaniesTable';
import { CompanyCardsView } from './components/CompanyCardsView';
import { EconodataModal } from './components/EconodataModal';
import { AuditSummary } from './components/AuditSummary';
import { EditParticipantModal } from './components/EditParticipantModal';
import { isValidCNPJ, formatCNPJ, onlyDigits } from './utils/cleaners';

export function App() {
  const [participants, setParticipants] = useState<ParticipantRecord[]>(INITIAL_SAMPLE_PARTICIPANTS);
  const [activeTab, setActiveTab] = useState<'participantes' | 'empresas' | 'cards' | 'auditoria'>('participantes');
  
  const [econodataStatus, setEconodataStatus] = useState<EconodataStatus | null>(null);
  const [isLoadingEconodata, setIsLoadingEconodata] = useState(false);
  const [isEconodataModalOpen, setIsEconodataModalOpen] = useState(false);
  
  const [showUpload, setShowUpload] = useState(false);
  const [isProcessingPipeline, setIsProcessingPipeline] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<string | null>(null);
  const [isSearchingSingleId, setIsSearchingSingleId] = useState<string | null>(null);
  
  const [editingParticipant, setEditingParticipant] = useState<ParticipantRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Consolidate companies
  const companies: EnrichedCompany[] = useMemo(() => {
    return consolidateCompanies(participants);
  }, [participants]);

  // Check Econodata status
  const checkEconodata = async () => {
    setIsLoadingEconodata(true);
    try {
      const res = await fetch('/api/econodata/status');
      if (res.ok) {
        const data = await res.json();
        setEconodataStatus(data);
      } else {
        setEconodataStatus({ configured: false, status: 'erro_verificacao' });
      }
    } catch {
      setEconodataStatus({ configured: false, status: 'indisponivel' });
    } finally {
      setIsLoadingEconodata(false);
    }
  };

  useEffect(() => {
    checkEconodata();
  }, []);

  // Handle file loaded
  const handleDataLoaded = (records: ParticipantRecord[], filename: string) => {
    setParticipants(records);
    setShowUpload(false);
    setBannerMessage({
      type: 'success',
      text: `Arquivo "${filename}" importado com sucesso! ${records.length} participantes carregados.`,
    });
  };

  // Run unified backend pipeline (identification + Econodata enrichment)
  const handleRunUnifiedPipeline = async () => {
    if (participants.length === 0) return;
    setIsProcessingPipeline(true);
    setPipelineProgress('Identificando CNPJs e consultando Econodata...');

    try {
      // Gather deduplicated companies payload for backend
      const payloadCompanies = companies.map((c) => ({
        id: c.id,
        nome: c.nomePadronizado || c.nomeEmpresa,
        cidade: c.cidade,
        uf: c.uf,
        telefone: c.telefone,
        ddd: c.ddd,
        cnpj: c.cnpj,
      }));

      const res = await fetch('/api/pipeline/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: payloadCompanies }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.results)) {
        const resultMap = new Map<string, any>();
        data.results.forEach((r: any) => {
          resultMap.set(r.companyId, r);
        });

        // Propagate enriched data back to participants
        setParticipants((prev) =>
          prev.map((p) => {
            const companyMatch = companies.find(
              (c) => c.participantesIds.includes(p.id) || c.nomePadronizado === p.empresaNormalizada
            );
            if (!companyMatch) return p;

            const enriched = resultMap.get(companyMatch.id);
            if (!enriched) return p;

            const finalCnpj = enriched.cnpj || p.cnpj;
            const valid = Boolean(finalCnpj && isValidCNPJ(finalCnpj));

            return {
              ...p,
              cnpj: valid ? formatCNPJ(finalCnpj) : p.cnpj,
              isMatriz: enriched.isMatriz ?? (valid ? onlyDigits(finalCnpj).substring(8, 12) === '0001' : p.isMatriz),
              razaoSocial: enriched.razaoSocial || p.razaoSocial,
              nomeFantasia: enriched.nomeFantasia || p.nomeFantasia,
              situacaoCadastral: enriched.situacaoCadastral || p.situacaoCadastral,
              regimeTributario: enriched.regimeTributario || p.regimeTributario,
              porteEmpresa: enriched.porteEmpresa || p.porteEmpresa,
              faturamento: enriched.faturamento || p.faturamento,
              faturamentoValor: enriched.faturamentoValor ?? p.faturamentoValor,
              faturamentoOrigem: enriched.faturamentoOrigem || p.faturamentoOrigem,
              cnae: enriched.cnae || p.cnae,
              naturezaJuridica: enriched.naturezaJuridica || p.naturezaJuridica,
              statusEnriquecimento: enriched.status || (valid ? 'CNPJ_IDENTIFICADO' : 'NAO_ENCONTRADO'),
              origemIdentificacao: enriched.identificationSource || p.origemIdentificacao,
              observacoes: enriched.observacao || p.observacoes,
            };
          })
        );

        setBannerMessage({
          type: 'success',
          text: `Enriquecimento concluído! ${data.summary?.cnpjsIdentificados || 0} CNPJs processados.`,
        });
      } else {
        setBannerMessage({
          type: 'error',
          text: data.error || 'Erro ao executar o pipeline de enriquecimento.',
        });
      }
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: `Falha na requisição ao backend: ${err.message}`,
      });
    } finally {
      setIsProcessingPipeline(false);
      setPipelineProgress(null);
    }
  };

  // Search single CNPJ
  const handleSearchSingleCNPJ = async (participant: ParticipantRecord) => {
    setIsSearchingSingleId(participant.id);
    try {
      const res = await fetch('/api/cnpj/search-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: participant.empresaNormalizada || participant.empresa,
          city: participant.cidade,
          uf: participant.uf || participant.ufOrigemDDD,
          phone: participant.telefone,
          ddd: participant.ddd,
        }),
      });

      const data = await res.json();
      if (data.success && data.cnpj && isValidCNPJ(data.cnpj)) {
        // Update this participant and all other participants from the same company
        const formatted = formatCNPJ(data.cnpj);
        const compName = participant.empresaNormalizada;

        setParticipants((prev) =>
          prev.map((p) => {
            if (p.empresaNormalizada === compName || p.id === participant.id) {
              return {
                ...p,
                cnpj: formatted,
                isMatriz: data.isMatriz ?? (onlyDigits(formatted).substring(8, 12) === '0001'),
                razaoSocial: data.razaoSocial || p.razaoSocial,
                nomeFantasia: data.nomeFantasia || p.nomeFantasia,
                situacaoCadastral: data.situacaoCadastral || p.situacaoCadastral || 'ATIVA',
                cnae: data.cnae || p.cnae,
                naturezaJuridica: data.naturezaJuridica || p.naturezaJuridica,
                statusEnriquecimento: p.statusEnriquecimento === 'CONSULTADO' ? 'CONSULTADO' : 'CNPJ_IDENTIFICADO',
                origemIdentificacao: data.sources?.[0]?.title || 'Receita Federal / Busca Web',
                observacoes: data.summary || 'CNPJ identificado e validado.',
              };
            }
            return p;
          })
        );

        setBannerMessage({
          type: 'success',
          text: `CNPJ ${formatted} localizado para ${compName}!`,
        });
      } else {
        setBannerMessage({
          type: 'info',
          text: data.summary || `Não foi possível localizar o CNPJ de "${participant.empresaNormalizada}".`,
        });
      }
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: `Erro ao pesquisar CNPJ: ${err.message}`,
      });
    } finally {
      setIsSearchingSingleId(null);
    }
  };

  // Search company CNPJ from company tab
  const handleSearchCompanyCNPJ = async (company: EnrichedCompany) => {
    const rep = participants.find((p) => p.empresaNormalizada === company.nomePadronizado);
    if (rep) {
      handleSearchSingleCNPJ(rep);
    }
  };

  // Edit participant
  const handleSaveParticipant = (updated: ParticipantRecord) => {
    setParticipants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setBannerMessage({
      type: 'success',
      text: `Cadastro de ${updated.nome} atualizado com sucesso.`,
    });
  };

  // Export Handlers
  const handleExportConsolidatedXLSX = () => {
    exportWorkbookXLSX(participants, 'Painel_ACESU_Econodata_Consolidado_7_Abas.xlsx');
    setBannerMessage({ type: 'success', text: 'Consolidado com 7 abas exportado com sucesso!' });
  };

  const handleExportEnrichedCompaniesXLSX = () => {
    exportEnrichedCompaniesXLSX(companies, 'ACESU_Empresas_Enriquecidas.xlsx');
    setBannerMessage({ type: 'success', text: 'Relatório de empresas enriquecidas exportado com sucesso!' });
  };

  const handleExportEmpresaCnpjXLSX = () => {
    exportEmpresaCnpjXLSX(companies, 'ACESU_Empresa_CNPJ_Compacto.xlsx');
    setBannerMessage({ type: 'success', text: 'Tabela compacta Empresa x CNPJ exportada com sucesso!' });
  };

  const handleExportParticipantsCSV = () => {
    const csvRows = participants.map((p) => ({
      'ID': p.id,
      'Nome': p.nome,
      'Email': p.email,
      'Telefone': p.telefone,
      'DDD': p.ddd || '',
      'UF_Origem': p.ufOrigemDDD || '',
      'Cargo': p.cargo,
      'Nivel_Hierarquico': p.nivelHierarquico,
      'Setor_Funcional': p.setorFuncional,
      'Empresa_Declarada': p.empresa,
      'Empresa_Padronizada': p.empresaNormalizada,
      'Cidade': p.cidade,
      'UF': p.uf,
      'CNPJ': p.cnpj,
      'Tipo': p.isMatriz ? 'Matriz' : p.cnpj ? 'Filial' : '',
      'Razao_Social': p.razaoSocial || '',
      'Nome_Fantasia': p.nomeFantasia || '',
      'Situacao': p.situacaoCadastral || '',
      'Regime_Tributario': p.regimeTributario || '',
      'Porte': p.porteEmpresa || '',
      'Faturamento': p.faturamento || '',
      'CNAE': p.cnae || '',
      'Status_Econodata': p.statusEnriquecimento,
      'Origem_Identificacao': p.origemIdentificacao || '',
      'Observacoes': p.observacoes || '',
    }));
    exportSingleCSV(csvRows, 'ACESU_Participantes_Consolidado.csv');
    setBannerMessage({ type: 'success', text: 'Base de participantes em CSV exportada com sucesso!' });
  };

  return (
    <div className="min-h-screen bg-[#E7ECEB] text-[#1E2E2C] flex flex-col selection:bg-[#C89439]/30 selection:text-[#162927]">
      {/* Header */}
      <Header
        econodataStatus={econodataStatus}
        isLoadingEconodata={isLoadingEconodata}
        isProcessingPipeline={isProcessingPipeline}
        onOpenEconodataInfo={() => setIsEconodataModalOpen(true)}
        onRunUnifiedPipeline={handleRunUnifiedPipeline}
        onExportConsolidatedXLSX={handleExportConsolidatedXLSX}
        onExportEnrichedCompaniesXLSX={handleExportEnrichedCompaniesXLSX}
        onExportEmpresaCnpjXLSX={handleExportEmpresaCnpjXLSX}
        onExportParticipantsCSV={handleExportParticipantsCSV}
        onResetSampleData={() => {
          setParticipants(INITIAL_SAMPLE_PARTICIPANTS);
          setBannerMessage({ type: 'info', text: 'Dados de exemplo restaurados.' });
        }}
        totalRecords={participants.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Banner Alert */}
        {bannerMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              bannerMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : bannerMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {bannerMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {bannerMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {bannerMessage.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
              <span className="font-medium">{bannerMessage.text}</span>
            </div>
            <button
              onClick={() => setBannerMessage(null)}
              className="text-gray-400 hover:text-gray-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessingPipeline && (
          <div className="bg-[#162927] text-white p-4 rounded-xl shadow-lg border border-[#2C3F3D] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-[#C89439] border-t-transparent rounded-full animate-spin" />
              <div>
                <div className="font-bold text-xs uppercase tracking-wider text-[#C89439]">
                  Pipeline em Execução
                </div>
                <div className="text-xs text-[#B8CAC7]">{pipelineProgress || 'Processando lotes...'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Executive Stats Cards */}
        <StatsCards participants={participants} companies={companies} />

        {/* Upload Toggle Drawer */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowUpload((prev) => !prev)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-[#FAFBFB] text-[#162927] rounded-xl text-xs font-bold border border-[#D5DFDC] shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4 text-[#3A605B]" />
            <span>{showUpload ? 'Ocultar Área de Upload' : 'Importar Nova Planilha (XLSX, CSV, JSON)'}</span>
          </button>
        </div>

        {showUpload && (
          <FileUpload
            onDataLoaded={handleDataLoaded}
            onClose={() => setShowUpload(false)}
          />
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-[#D5DFDC]">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('participantes')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'participantes'
                  ? 'border-[#C89439] text-[#162927]'
                  : 'border-transparent text-[#68827E] hover:text-[#162927]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Participantes Consolidados ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('empresas')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'empresas'
                  ? 'border-[#C89439] text-[#162927]'
                  : 'border-transparent text-[#68827E] hover:text-[#162927]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>2. Empresas Enriquecidas ({companies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cards')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'cards'
                  ? 'border-[#C89439] text-[#162927]'
                  : 'border-transparent text-[#68827E] hover:text-[#162927]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>3. Cards das Redes</span>
            </button>

            <button
              onClick={() => setActiveTab('auditoria')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'auditoria'
                  ? 'border-[#C89439] text-[#162927]'
                  : 'border-transparent text-[#68827E] hover:text-[#162927]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>4. Auditoria & Métricas</span>
            </button>
          </nav>
        </div>

        {/* Tab Contents */}
        {activeTab === 'participantes' && (
          <DataTable
            participants={participants}
            onSearchSingleCNPJ={handleSearchSingleCNPJ}
            onEditParticipant={(p) => {
              setEditingParticipant(p);
              setIsEditModalOpen(true);
            }}
            isSearchingSingleId={isSearchingSingleId}
          />
        )}

        {activeTab === 'empresas' && (
          <EnrichedCompaniesTable
            companies={companies}
            onSearchCompanyCNPJ={handleSearchCompanyCNPJ}
            isSearchingId={isSearchingSingleId}
          />
        )}

        {activeTab === 'cards' && (
          <CompanyCardsView
            companies={companies}
            participants={participants}
          />
        )}

        {activeTab === 'auditoria' && (
          <AuditSummary
            participants={participants}
            companies={companies}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#162927] text-[#9EB2AF] border-t border-[#2C3F3D] py-4 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            6º Fórum de Prevenção de Perdas — <strong className="text-white">ACESU</strong> (Associação Central dos Supermercados)
          </div>
          <div>
            Curadoria & Arquitetura de Dados: <strong className="text-[#E5B55E]">Strategicos Group</strong>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EconodataModal
        status={econodataStatus}
        isOpen={isEconodataModalOpen}
        onClose={() => setIsEconodataModalOpen(false)}
        onRefresh={() => {
          checkEconodata();
          setBannerMessage({ type: 'info', text: 'Verificando conexão com a Econodata...' });
        }}
      />

      <EditParticipantModal
        participant={editingParticipant}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingParticipant(null);
        }}
        onSave={handleSaveParticipant}
      />
    </div>
  );
}
export default App;
