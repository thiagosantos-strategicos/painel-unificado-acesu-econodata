import React from 'react';
import { 
  Users, 
  Building2, 
  CheckCircle2, 
  DollarSign, 
  Briefcase, 
  ShieldAlert, 
  TrendingUp, 
  Coins 
} from 'lucide-react';
import { ParticipantRecord, EnrichedCompany } from '../types';

interface StatsCardsProps {
  participants: ParticipantRecord[];
  companies: EnrichedCompany[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ participants, companies }) => {
  const totalParticipantes = participants.length;
  const totalEmpresas = companies.length;

  const cnpjsValidados = companies.filter((c) => Boolean(c.cnpj)).length;
  const cnpjsMatriz = companies.filter((c) => c.isMatriz).length;
  const percentCnpj = totalEmpresas > 0 ? Math.round((cnpjsValidados / totalEmpresas) * 100) : 0;

  const econodataEnriquecidas = companies.filter((c) => c.statusEnriquecimento === 'CONSULTADO').length;
  const faturamentoIdentificado = companies.filter((c) => Boolean(c.faturamento)).length;

  const liderancas = participants.filter((p) =>
    p.nivelHierarquico === 'C-Level / Presidência' || p.nivelHierarquico === 'Diretoria' || p.nivelHierarquico === 'Gerência'
  ).length;
  const percentLiderancas = totalParticipantes > 0 ? Math.round((liderancas / totalParticipantes) * 100) : 0;

  const prevencaoPerdas = participants.filter((p) => p.setorFuncional === 'Prevenção de Perdas & Riscos').length;
  const percentPrevencao = totalParticipantes > 0 ? Math.round((prevencaoPerdas / totalParticipantes) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Participantes & Empresas */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#D5DFDC]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#68827E] uppercase tracking-wider">
            Audiência Confirmada
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#E2EBE9] flex items-center justify-center text-[#1F3D39]">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#162927] font-display">
            {totalParticipantes}
          </span>
          <span className="text-xs font-medium text-[#4D6965]">participantes</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#EDF2F0] flex items-center justify-between text-xs text-[#526F6B]">
          <span className="flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-[#3A605B]" />
            <span>Empresas únicas:</span>
          </span>
          <span className="font-bold text-[#162927]">{totalEmpresas} redes/marcas</span>
        </div>
      </div>

      {/* 2. CNPJ Identification */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#D5DFDC]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#68827E] uppercase tracking-wider">
            CNPJs Identificados
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0369A1]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#162927] font-display">
            {cnpjsValidados} <span className="text-lg font-normal text-[#68827E]">/ {totalEmpresas}</span>
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {percentCnpj}%
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#EDF2F0] flex items-center justify-between text-xs text-[#526F6B]">
          <span>CNPJs Matriz (/0001):</span>
          <span className="font-bold text-[#162927]">{cnpjsMatriz} confirmados</span>
        </div>
      </div>

      {/* 3. Fiscal & Financial Enrichment */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#D5DFDC]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#68827E] uppercase tracking-wider">
            Enriquecimento Econodata
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#B45309]">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#162927] font-display">
            {econodataEnriquecidas}
          </span>
          <span className="text-xs font-medium text-[#4D6965]">empresas enriquecidas</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#EDF2F0] flex items-center justify-between text-xs text-[#526F6B]">
          <span>Com Faturamento:</span>
          <span className="font-bold text-[#162927]">{faturamentoIdentificado} empresas</span>
        </div>
      </div>

      {/* 4. Leadership & Sector Profile */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#D5DFDC]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#68827E] uppercase tracking-wider">
            Perfil Decisores & P&R
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] flex items-center justify-center text-[#7E22CE]">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#162927] font-display">
            {liderancas}
          </span>
          <span className="text-xs font-medium text-[#4D6965]">C-Level, Diretores e Gerentes ({percentLiderancas}%)</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#EDF2F0] flex items-center justify-between text-xs text-[#526F6B]">
          <span>Setor P&R e Segurança:</span>
          <span className="font-bold text-[#162927]">{prevencaoPerdas} ({percentPrevencao}%)</span>
        </div>
      </div>
    </div>
  );
};
