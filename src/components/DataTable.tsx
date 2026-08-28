import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  ExternalLink, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Building2, 
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ParticipantRecord, HierarchicalLevel, FunctionalSector, EnrichmentStatus } from '../types';

interface DataTableProps {
  participants: ParticipantRecord[];
  onSearchSingleCNPJ: (participant: ParticipantRecord) => void;
  onEditParticipant: (participant: ParticipantRecord) => void;
  isSearchingSingleId?: string | null;
}

export const DataTable: React.FC<DataTableProps> = ({
  participants,
  onSearchSingleCNPJ,
  onEditParticipant,
  isSearchingSingleId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ufFilter, setUfFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter options
  const ufs = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.uf) set.add(p.uf);
      else if (p.ufOrigemDDD) set.add(p.ufOrigemDDD);
    });
    return Array.from(set).sort();
  }, [participants]);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      const matchSearch =
        searchTerm === '' ||
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.cnpj && p.cnpj.includes(searchTerm)) ||
        (p.cidade && p.cidade.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchLevel = levelFilter === 'ALL' || p.nivelHierarquico === levelFilter;
      const matchSector = sectorFilter === 'ALL' || p.setorFuncional === sectorFilter;
      const matchStatus = statusFilter === 'ALL' || p.statusEnriquecimento === statusFilter;
      const matchUf = ufFilter === 'ALL' || p.uf === ufFilter || p.ufOrigemDDD === ufFilter;

      return matchSearch && matchLevel && matchSector && matchStatus && matchUf;
    });
  }, [participants, searchTerm, levelFilter, sectorFilter, statusFilter, ufFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const getStatusBadge = (status: EnrichmentStatus) => {
    switch (status) {
      case 'CONSULTADO':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Consultado Econodata</span>
          </span>
        );
      case 'CNPJ_IDENTIFICADO':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <CheckCircle2 className="w-3 h-3 text-sky-600" />
            <span>CNPJ Confirmado</span>
          </span>
        );
      case 'CHAVE_AUSENTE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Chave Econodata Ausente</span>
          </span>
        );
      case 'NAO_ENCONTRADO':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>Pendente de CNPJ</span>
          </span>
        );
    }
  };

  const getLevelBadge = (level: HierarchicalLevel) => {
    if (level === 'C-Level / Presidência') {
      return 'bg-purple-100 text-purple-800 border-purple-200 font-bold';
    }
    if (level === 'Diretoria') {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold';
    }
    if (level === 'Gerência') {
      return 'bg-blue-100 text-blue-800 border-blue-200 font-medium';
    }
    if (level === 'Coordenação / Supervisão') {
      return 'bg-teal-100 text-teal-800 border-teal-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D5DFDC] overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-[#E3EBE9] bg-[#FAFBFB] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por participante, empresa, cargo, CNPJ, cidade..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#CDD8D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A605B] focus:border-transparent text-[#162927]"
            />
          </div>

          <div className="text-xs text-[#526F6B] font-medium">
            Exibindo <span className="font-bold text-[#162927]">{filtered.length}</span> de{' '}
            <span className="font-bold text-[#162927]">{participants.length}</span> confirmados
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center space-x-1 text-xs text-[#526F6B] mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-[#CDD8D5] rounded-md px-2.5 py-1 text-[#162927] focus:outline-none focus:ring-1 focus:ring-[#3A605B]"
          >
            <option value="ALL">Todos os Níveis Hierárquicos</option>
            <option value="C-Level / Presidência">C-Level / Presidência</option>
            <option value="Diretoria">Diretoria</option>
            <option value="Gerência">Gerência</option>
            <option value="Coordenação / Supervisão">Coordenação / Supervisão</option>
            <option value="Especialista / Consultor">Especialista / Consultor</option>
            <option value="Analista">Analista</option>
            <option value="Operacional / Assistente">Operacional / Assistente</option>
          </select>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-[#CDD8D5] rounded-md px-2.5 py-1 text-[#162927] focus:outline-none focus:ring-1 focus:ring-[#3A605B]"
          >
            <option value="ALL">Todos os Setores</option>
            <option value="Prevenção de Perdas & Riscos">Prevenção de Perdas & Riscos</option>
            <option value="Segurança Patrimonial & Cibernética">Segurança Patrimonial & Cibernética</option>
            <option value="Auditoria & Compliance">Auditoria & Compliance</option>
            <option value="Operações & Logística">Operações & Logística</option>
            <option value="Tecnologia & Inovação">Tecnologia & Inovação</option>
            <option value="Comercial & Vendas">Comercial & Vendas</option>
            <option value="Financeiro & Administrativo">Financeiro & Administrativo</option>
            <option value="Geral / Executivo">Geral / Executivo</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-[#CDD8D5] rounded-md px-2.5 py-1 text-[#162927] focus:outline-none focus:ring-1 focus:ring-[#3A605B]"
          >
            <option value="ALL">Todos os Status</option>
            <option value="CONSULTADO">Consultado Econodata</option>
            <option value="CNPJ_IDENTIFICADO">CNPJ Confirmado</option>
            <option value="NAO_ENCONTRADO">Pendente de CNPJ</option>
          </select>

          {/* UF Filter */}
          {ufs.length > 0 && (
            <select
              value={ufFilter}
              onChange={(e) => {
                setUfFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-[#CDD8D5] rounded-md px-2.5 py-1 text-[#162927] focus:outline-none focus:ring-1 focus:ring-[#3A605B]"
            >
              <option value="ALL">Todas as UFs</option>
              {ufs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          )}

          {(levelFilter !== 'ALL' || sectorFilter !== 'ALL' || statusFilter !== 'ALL' || ufFilter !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setLevelFilter('ALL');
                setSectorFilter('ALL');
                setStatusFilter('ALL');
                setUfFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-[#8B3A3A] hover:underline px-1 font-medium"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#EEF3F2] text-[#2C4A46] font-bold border-b border-[#D5DFDC] uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-3.5">Participante</th>
              <th className="py-3 px-3">Cargo & Nível</th>
              <th className="py-3 px-3">Empresa & Origem</th>
              <th className="py-3 px-3">CNPJ Matriz / Filial</th>
              <th className="py-3 px-3">Enriquecimento Econodata</th>
              <th className="py-3 px-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7ECEB] text-[#1E2E2C]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Nenhum registro corresponde aos filtros selecionados.
                </td>
              </tr>
            ) : (
              paginated.map((p) => {
                const isSearchingThis = isSearchingSingleId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-[#F6FAF9] transition-colors">
                    {/* 1. Participante */}
                    <td className="py-3 px-3.5 align-top">
                      <div className="font-semibold text-sm text-[#162927]">{p.nome}</div>
                      <div className="text-[11px] text-[#55736E]">{p.email}</div>
                      <div className="text-[11px] text-[#55736E] flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#738F8B]" />
                        <span>{p.telefone || 'Sem telefone'}</span>
                        {p.ufOrigemDDD && (
                          <span className="text-[10px] bg-[#E2EBE9] text-[#1F3D39] px-1 rounded">
                            DDD {p.ddd} ({p.ufOrigemDDD})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Cargo & Nível */}
                    <td className="py-3 px-3 align-top max-w-[200px]">
                      <div className="font-medium text-[#162927]">{p.cargo}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${getLevelBadge(
                            p.nivelHierarquico
                          )}`}
                        >
                          {p.nivelHierarquico}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {p.setorFuncional}
                        </span>
                      </div>
                    </td>

                    {/* 3. Empresa */}
                    <td className="py-3 px-3 align-top max-w-[220px]">
                      <div className="font-bold text-[#162927]">{p.empresaNormalizada}</div>
                      {p.empresa !== p.empresaNormalizada && (
                        <div className="text-[10px] text-gray-500 italic">Decl: {p.empresa}</div>
                      )}
                      <div className="text-[11px] text-[#55736E] flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#738F8B]" />
                        <span>
                          {p.cidade ? `${p.cidade} - ${p.uf || p.ufOrigemDDD || 'BR'}` : p.uf || p.ufOrigemDDD || 'Brasil'}
                        </span>
                      </div>
                    </td>

                    {/* 4. CNPJ */}
                    <td className="py-3 px-3 align-top">
                      {p.cnpj ? (
                        <div>
                          <div className="font-mono text-xs font-bold text-[#162927] bg-[#EAF0EE] px-1.5 py-0.5 rounded inline-block">
                            {p.cnpj}
                          </div>
                          <div className="flex items-center space-x-1 mt-1 text-[10px]">
                            {p.isMatriz ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">
                                Matriz (/0001)
                              </span>
                            ) : (
                              <span className="text-gray-600 bg-gray-100 px-1 rounded">Filial</span>
                            )}
                            {p.situacaoCadastral && (
                              <span className="text-gray-700 bg-gray-100 px-1 rounded">
                                {p.situacaoCadastral}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-[11px]">CNPJ Não Identificado</div>
                      )}
                    </td>

                    {/* 5. Enriquecimento Econodata */}
                    <td className="py-3 px-3 align-top">
                      <div>{getStatusBadge(p.statusEnriquecimento)}</div>
                      {p.faturamento && (
                        <div className="mt-1 text-[11px] text-[#162927] font-semibold">
                          Fat: <span className="text-[#8B5E0D]">{p.faturamento}</span>
                        </div>
                      )}
                      {p.regimeTributario && (
                        <div className="text-[10px] text-gray-600">Regime: {p.regimeTributario}</div>
                      )}
                    </td>

                    {/* 6. Ações */}
                    <td className="py-3 px-3 align-top text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Single search */}
                        <button
                          onClick={() => onSearchSingleCNPJ(p)}
                          disabled={isSearchingThis}
                          title="Pesquisar/Validar CNPJ na Receita Federal e Web"
                          className="p-1.5 rounded text-[#2C4A46] hover:bg-[#E2EBE9] border border-[#CDD8D5] transition-colors disabled:opacity-50"
                        >
                          <Sparkles
                            className={`w-3.5 h-3.5 ${isSearchingThis ? 'animate-spin text-[#C89439]' : ''}`}
                          />
                        </button>

                        {/* Edit participant */}
                        <button
                          onClick={() => onEditParticipant(p)}
                          title="Editar dados cadastrais"
                          className="p-1.5 rounded text-[#2C4A46] hover:bg-[#E2EBE9] border border-[#CDD8D5] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-[#FAFBFB] border-t border-[#E3EBE9] flex items-center justify-between text-xs text-[#526F6B]">
        <div>
          Página <span className="font-bold text-[#162927]">{currentPage}</span> de{' '}
          <span className="font-bold text-[#162927]">{totalPages}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-[#CDD8D5] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-[#CDD8D5] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
