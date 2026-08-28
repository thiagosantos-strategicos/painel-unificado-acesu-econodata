import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  DollarSign, 
  MapPin, 
  Users, 
  FileSpreadsheet, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { EnrichedCompany } from '../types';
import { exportSingleCSV } from '../utils/exportUtils';

interface EnrichedCompaniesTableProps {
  companies: EnrichedCompany[];
  onSearchCompanyCNPJ: (company: EnrichedCompany) => void;
  isSearchingId?: string | null;
}

export const EnrichedCompaniesTable: React.FC<EnrichedCompaniesTableProps> = ({
  companies,
  onSearchCompanyCNPJ,
  isSearchingId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyWithCnpj, setOnlyWithCnpj] = useState(false);
  const [onlyEnriched, setOnlyEnriched] = useState(false);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        searchTerm === '' ||
        c.nomePadronizado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm) ||
        c.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.uf.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCnpj = !onlyWithCnpj || Boolean(c.cnpj);
      const matchEnriched = !onlyEnriched || c.statusEnriquecimento === 'CONSULTADO';

      return matchSearch && matchCnpj && matchEnriched;
    });
  }, [companies, searchTerm, onlyWithCnpj, onlyEnriched]);

  const handleExportCSV = () => {
    const rows = filtered.map((c) => ({
      'ID Empresa': c.id,
      'Empresa Padronizada': c.nomePadronizado,
      'Empresa Original': c.nomeEmpresa,
      'Total Participantes': c.totalParticipantes,
      'CNPJ': c.cnpj,
      'Tipo': c.isMatriz ? 'Matriz' : c.cnpj ? 'Filial' : '',
      'Razão Social': c.razaoSocial,
      'Nome Fantasia': c.nomeFantasia,
      'Situação': c.situacaoCadastral,
      'Regime Tributário': c.regimeTributario,
      'Porte': c.porteEmpresa,
      'Faturamento Estimado': c.faturamento,
      'Origem Faturamento': c.faturamentoOrigem,
      'Cidade': c.cidade,
      'UF': c.uf,
      'CNAE': c.cnae,
      'Natureza Jurídica': c.naturezaJuridica,
      'Status Econodata': c.statusEnriquecimento,
      'Origem CNPJ': c.origemIdentificacao,
      'Observações': c.observacoes,
    }));
    exportSingleCSV(rows, 'EMPRESAS_ENRIQUECIDAS.csv');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D5DFDC] overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-[#E3EBE9] bg-[#FAFBFB] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#3A605B]" />
              <h2 className="text-base font-bold text-[#162927] font-display uppercase tracking-wide">
                Consolidado Corporativo: Empresas Enriquecidas
              </h2>
            </div>
            <p className="text-xs text-[#526F6B]">
              Visão deduplicada por rede/supermercado com faturamento, regime fiscal e dados da Receita Federal
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E2EBE9] hover:bg-[#D5E1DE] text-[#1F3D39] rounded-lg text-xs font-semibold border border-[#BDCEC9] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Aba (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por empresa, CNPJ, razão social, cidade..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CDD8D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
            />
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <label className="flex items-center space-x-1.5 cursor-pointer text-[#334D49]">
              <input
                type="checkbox"
                checked={onlyWithCnpj}
                onChange={(e) => setOnlyWithCnpj(e.target.checked)}
                className="rounded border-[#B8CAC7] text-[#3A605B] focus:ring-[#3A605B]"
              />
              <span>Apenas com CNPJ ({companies.filter((c) => Boolean(c.cnpj)).length})</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-[#334D49]">
              <input
                type="checkbox"
                checked={onlyEnriched}
                onChange={(e) => setOnlyEnriched(e.target.checked)}
                className="rounded border-[#B8CAC7] text-[#3A605B] focus:ring-[#3A605B]"
              />
              <span>Apenas com Econodata ({companies.filter((c) => c.statusEnriquecimento === 'CONSULTADO').length})</span>
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#EEF3F2] text-[#2C4A46] font-bold border-b border-[#D5DFDC] uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-3.5">Empresa & Inscritos</th>
              <th className="py-3 px-3">CNPJ & Situação</th>
              <th className="py-3 px-3">Razão Social & CNAE</th>
              <th className="py-3 px-3">Faturamento Estimado</th>
              <th className="py-3 px-3">Regime & Porte</th>
              <th className="py-3 px-3">Localização</th>
              <th className="py-3 px-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7ECEB] text-[#1E2E2C]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Nenhuma empresa encontrada com os critérios informados.
                </td>
              </tr>
            ) : (
              filtered.map((comp) => {
                const isSearching = isSearchingId === comp.id;
                return (
                  <tr key={comp.id} className="hover:bg-[#F6FAF9] transition-colors">
                    {/* 1. Empresa */}
                    <td className="py-3 px-3.5 align-top">
                      <div className="font-bold text-sm text-[#162927]">{comp.nomePadronizado}</div>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="inline-flex items-center space-x-1 bg-[#E2EBE9] text-[#1F3D39] px-2 py-0.5 rounded text-[11px] font-semibold">
                          <Users className="w-3 h-3" />
                          <span>{comp.totalParticipantes} {comp.totalParticipantes === 1 ? 'inscrito' : 'inscritos'}</span>
                        </span>
                      </div>
                    </td>

                    {/* 2. CNPJ */}
                    <td className="py-3 px-3 align-top">
                      {comp.cnpj ? (
                        <div>
                          <span className="font-mono font-bold text-xs bg-[#EAF0EE] px-1.5 py-0.5 rounded text-[#162927]">
                            {comp.cnpj}
                          </span>
                          <div className="flex items-center space-x-1 mt-1 text-[10px]">
                            {comp.isMatriz ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">
                                Matriz (/0001)
                              </span>
                            ) : (
                              <span className="text-gray-600 bg-gray-100 px-1 rounded">Filial</span>
                            )}
                            {comp.situacaoCadastral && (
                              <span className="text-gray-700 bg-gray-100 px-1 rounded">
                                {comp.situacaoCadastral}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Pendente</span>
                      )}
                    </td>

                    {/* 3. Razão Social & CNAE */}
                    <td className="py-3 px-3 align-top max-w-[240px]">
                      <div className="font-medium text-[#162927] text-xs">
                        {comp.razaoSocial || comp.nomeFantasia || 'Não informada'}
                      </div>
                      {comp.cnae && (
                        <div className="text-[10px] text-gray-500 line-clamp-2 mt-0.5" title={comp.cnae}>
                          {comp.cnae}
                        </div>
                      )}
                    </td>

                    {/* 4. Faturamento */}
                    <td className="py-3 px-3 align-top">
                      {comp.faturamento ? (
                        <div>
                          <div className="font-semibold text-xs text-[#8B5E0D]">{comp.faturamento}</div>
                          <div className="text-[10px] text-gray-500">{comp.faturamentoOrigem || 'Econodata'}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* 5. Regime & Porte */}
                    <td className="py-3 px-3 align-top">
                      <div className="text-xs text-[#162927]">{comp.regimeTributario || '—'}</div>
                      <div className="text-[10px] text-gray-500">{comp.porteEmpresa || 'Porte não informado'}</div>
                    </td>

                    {/* 6. Localização */}
                    <td className="py-3 px-3 align-top">
                      <div className="flex items-center space-x-1 text-xs text-[#55736E]">
                        <MapPin className="w-3 h-3 text-[#738F8B]" />
                        <span>{comp.cidade ? `${comp.cidade} - ${comp.uf || 'BR'}` : comp.uf || 'Brasil'}</span>
                      </div>
                    </td>

                    {/* 7. Ações */}
                    <td className="py-3 px-3 align-top text-center">
                      <button
                        onClick={() => onSearchCompanyCNPJ(comp)}
                        disabled={isSearching}
                        title="Pesquisar/Revalidar CNPJ"
                        className="p-1.5 rounded text-[#2C4A46] hover:bg-[#E2EBE9] border border-[#CDD8D5] transition-colors disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin text-[#C89439]' : ''}`} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
