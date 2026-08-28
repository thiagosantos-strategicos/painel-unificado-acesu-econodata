import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  DollarSign, 
  ShieldCheck, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Download
} from 'lucide-react';
import { EnrichedCompany, ParticipantRecord } from '../types';
import { exportSingleCSV } from '../utils/exportUtils';

interface CompanyCardsViewProps {
  companies: EnrichedCompany[];
  participants: ParticipantRecord[];
}

export const CompanyCardsView: React.FC<CompanyCardsViewProps> = ({
  companies,
  participants,
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const participantMap = new Map<string, ParticipantRecord>();
  participants.forEach((p) => participantMap.set(p.id, p));

  const handleExportCardsCSV = () => {
    const rows = companies.map((c) => ({
      'Rede/Empresa': c.nomePadronizado,
      'CNPJ Matriz': c.cnpj,
      'Razão Social': c.razaoSocial,
      'Faturamento Estimado': c.faturamento,
      'Regime Tributário': c.regimeTributario,
      'Porte Empresarial': c.porteEmpresa,
      'Cidade': c.cidade,
      'UF': c.uf,
      'Total Delegados ACESU': c.totalParticipantes,
      'Nomes dos Participantes': c.participantesIds
        .map((id) => participantMap.get(id)?.nome)
        .filter(Boolean)
        .join('; '),
    }));
    exportSingleCSV(rows, 'CARDS_EXECUTIVOS_ACESU.csv');
  };

  return (
    <div className="space-y-4">
      {/* Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-[#D5DFDC]">
        <div>
          <h2 className="text-base font-bold text-[#162927] font-display uppercase tracking-wide">
            Cards Executivos das Redes e Varejistas
          </h2>
          <p className="text-xs text-[#526F6B]">
            Panorama corporativo por marca com faturamento, regime fiscal e delegação confirmada
          </p>
        </div>

        <button
          onClick={handleExportCardsCSV}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E2EBE9] hover:bg-[#D5E1DE] text-[#1F3D39] rounded-lg text-xs font-semibold border border-[#BDCEC9] transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Cards (CSV)</span>
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((comp) => {
          const isExpanded = expandedCardId === comp.id;
          const companyParticipants = comp.participantesIds
            .map((id) => participantMap.get(id))
            .filter((p): p is ParticipantRecord => Boolean(p));

          return (
            <div
              key={comp.id}
              className="bg-white rounded-xl border border-[#D5DFDC] shadow-sm hover:shadow transition-shadow flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#EDF2F0]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#162927] leading-tight">
                      {comp.nomePadronizado}
                    </h3>
                    <div className="flex items-center space-x-1 text-xs text-[#55736E] mt-1">
                      <MapPin className="w-3 h-3 text-[#738F8B]" />
                      <span>{comp.cidade ? `${comp.cidade} - ${comp.uf || 'BR'}` : comp.uf || 'Brasil'}</span>
                    </div>
                  </div>
                  <span className="bg-[#E2EBE9] text-[#1F3D39] text-xs font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{comp.totalParticipantes}</span>
                  </span>
                </div>

                {comp.cnpj ? (
                  <div className="mt-3 flex items-center justify-between bg-[#F4F7F6] px-2.5 py-1.5 rounded-lg text-xs">
                    <div className="font-mono font-bold text-[#162927]">{comp.cnpj}</div>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
                      {comp.isMatriz ? 'Matriz /0001' : 'Filial'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 bg-gray-50 text-gray-500 text-xs px-2.5 py-1.5 rounded-lg italic">
                    CNPJ pendente de identificação
                  </div>
                )}
              </div>

              {/* Card Body: Fiscal & Financial Data */}
              <div className="p-4 space-y-2.5 text-xs text-[#334D49]">
                {/* Razão Social */}
                {comp.razaoSocial && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#68827E] block">Razão Social</span>
                    <span className="text-xs text-[#162927] font-medium">{comp.razaoSocial}</span>
                  </div>
                )}

                {/* Faturamento */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EDF2F0]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#68827E] block">Faturamento</span>
                    <span className="text-xs font-bold text-[#8B5E0D]">
                      {comp.faturamento || 'Sob Consulta'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#68827E] block">Regime Tributário</span>
                    <span className="text-xs text-[#162927] font-medium">
                      {comp.regimeTributario || 'Não Identificado'}
                    </span>
                  </div>
                </div>

                {/* Porte & CNAE */}
                <div className="pt-1 border-t border-[#EDF2F0]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#68827E]">Porte:</span>
                    <span className="font-medium text-[#162927]">{comp.porteEmpresa || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Attendees Accordion */}
              <div className="bg-[#FAFBFB] p-3 border-t border-[#EDF2F0]">
                <button
                  onClick={() => setExpandedCardId(isExpanded ? null : comp.id)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#2C4A46] hover:text-[#162927] transition-colors"
                >
                  <span>Ver {comp.totalParticipantes} participante(s) da rede</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 space-y-1.5 pt-2 border-t border-[#E3EBE9]">
                    {companyParticipants.map((p) => (
                      <div key={p.id} className="text-xs bg-white p-2 rounded border border-[#E3EBE9]">
                        <div className="font-semibold text-[#162927]">{p.nome}</div>
                        <div className="text-[11px] text-[#55736E]">{p.cargo}</div>
                        <div className="text-[10px] text-gray-500">{p.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
