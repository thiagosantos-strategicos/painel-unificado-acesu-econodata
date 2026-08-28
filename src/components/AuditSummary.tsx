import React from 'react';
import { 
  ShieldCheck, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  PieChart, 
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { ParticipantRecord, EnrichedCompany } from '../types';

interface AuditSummaryProps {
  participants: ParticipantRecord[];
  companies: EnrichedCompany[];
}

export const AuditSummary: React.FC<AuditSummaryProps> = ({
  participants,
  companies,
}) => {
  // Compute hierarchical distribution
  const hierarchyCounts: Record<string, number> = {};
  participants.forEach((p) => {
    hierarchyCounts[p.nivelHierarquico] = (hierarchyCounts[p.nivelHierarquico] || 0) + 1;
  });

  // Compute functional sector distribution
  const sectorCounts: Record<string, number> = {};
  participants.forEach((p) => {
    sectorCounts[p.setorFuncional] = (sectorCounts[p.setorFuncional] || 0) + 1;
  });

  // Compute tax regime distribution
  const regimeCounts: Record<string, number> = {};
  companies.forEach((c) => {
    const reg = c.regimeTributario || 'Não Identificado';
    regimeCounts[reg] = (regimeCounts[reg] || 0) + 1;
  });

  // Compute status distribution
  const statusCounts: Record<string, number> = {};
  companies.forEach((c) => {
    statusCounts[c.statusEnriquecimento] = (statusCounts[c.statusEnriquecimento] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="bg-white p-4 rounded-xl border border-[#D5DFDC]">
        <h2 className="text-base font-bold text-[#162927] font-display uppercase tracking-wide flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[#3A605B]" />
          <span>Auditoria Cadastral e Distribuição Demográfica do 6º Fórum</span>
        </h2>
        <p className="text-xs text-[#526F6B]">
          Consolidação analítica de conformidade, níveis de liderança e cobertura fiscal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Níveis Hierárquicos */}
        <div className="bg-white p-4 rounded-xl border border-[#D5DFDC] shadow-sm">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#EDF2F0]">
            <Layers className="w-4 h-4 text-[#3A605B]" />
            <h3 className="font-bold text-xs uppercase text-[#162927]">Níveis Hierárquicos</h3>
          </div>
          <div className="mt-3 space-y-2">
            {Object.entries(hierarchyCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([level, count]) => {
                const pct = participants.length > 0 ? Math.round((count / participants.length) * 100) : 0;
                return (
                  <div key={level} className="text-xs">
                    <div className="flex justify-between text-[#2C3F3D] mb-1">
                      <span className="font-medium truncate pr-2">{level}</span>
                      <span className="font-bold text-[#162927]">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EDF2F0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3A605B] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 2. Setores Funcionais */}
        <div className="bg-white p-4 rounded-xl border border-[#D5DFDC] shadow-sm">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#EDF2F0]">
            <PieChart className="w-4 h-4 text-[#C89439]" />
            <h3 className="font-bold text-xs uppercase text-[#162927]">Setores Funcionais</h3>
          </div>
          <div className="mt-3 space-y-2">
            {Object.entries(sectorCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([sector, count]) => {
                const pct = participants.length > 0 ? Math.round((count / participants.length) * 100) : 0;
                return (
                  <div key={sector} className="text-xs">
                    <div className="flex justify-between text-[#2C3F3D] mb-1">
                      <span className="font-medium truncate pr-2">{sector}</span>
                      <span className="font-bold text-[#162927]">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EDF2F0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C89439] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 3. Regimes Tributários das Empresas */}
        <div className="bg-white p-4 rounded-xl border border-[#D5DFDC] shadow-sm">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#EDF2F0]">
            <BarChart3 className="w-4 h-4 text-[#7E22CE]" />
            <h3 className="font-bold text-xs uppercase text-[#162927]">Regimes Tributários</h3>
          </div>
          <div className="mt-3 space-y-2">
            {Object.entries(regimeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([regime, count]) => {
                const pct = companies.length > 0 ? Math.round((count / companies.length) * 100) : 0;
                return (
                  <div key={regime} className="text-xs">
                    <div className="flex justify-between text-[#2C3F3D] mb-1">
                      <span className="font-medium truncate pr-2">{regime}</span>
                      <span className="font-bold text-[#162927]">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EDF2F0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#7E22CE] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
