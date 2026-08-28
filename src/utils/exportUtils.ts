import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ParticipantRecord, EnrichedCompany } from '../types';

export function consolidateCompanies(records: ParticipantRecord[]): EnrichedCompany[] {
  const map = new Map<string, EnrichedCompany>();

  for (const record of records) {
    const rawKey = (record.empresaNormalizada || record.empresa || 'EMPRESA_NAO_INFORMADA').trim();
    const key = rawKey.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        id: `EMP-${map.size + 1}`,
        chaveNormalizada: key,
        nomeEmpresa: record.empresa,
        nomePadronizado: record.empresaNormalizada || record.empresa,
        totalParticipantes: 1,
        participantesIds: [record.id],
        cidade: record.cidade || '',
        uf: record.uf || record.ufOrigemDDD || '',
        ddd: record.ddd,
        telefone: record.telefone,
        cnpj: record.cnpj || '',
        isMatriz: record.isMatriz ?? false,
        razaoSocial: record.razaoSocial || '',
        nomeFantasia: record.nomeFantasia || '',
        situacaoCadastral: record.situacaoCadastral || '',
        regimeTributario: record.regimeTributario || '',
        porteEmpresa: record.porteEmpresa || '',
        faturamento: record.faturamento || '',
        faturamentoValor: record.faturamentoValor ?? null,
        faturamentoOrigem: record.faturamentoOrigem || '',
        cnae: record.cnae || '',
        naturezaJuridica: record.naturezaJuridica || '',
        statusEnriquecimento: record.statusEnriquecimento,
        origemIdentificacao: record.origemIdentificacao || '',
        observacoes: record.observacoes || '',
      });
    } else {
      const existing = map.get(key)!;
      existing.totalParticipantes += 1;
      existing.participantesIds.push(record.id);

      // Backfill any missing fields if this record has more data
      if (!existing.cnpj && record.cnpj) existing.cnpj = record.cnpj;
      if (!existing.razaoSocial && record.razaoSocial) existing.razaoSocial = record.razaoSocial;
      if (!existing.nomeFantasia && record.nomeFantasia) existing.nomeFantasia = record.nomeFantasia;
      if (!existing.cidade && record.cidade) existing.cidade = record.cidade;
      if (!existing.uf && (record.uf || record.ufOrigemDDD)) existing.uf = record.uf || record.ufOrigemDDD || '';
      if (!existing.regimeTributario && record.regimeTributario) existing.regimeTributario = record.regimeTributario;
      if (!existing.porteEmpresa && record.porteEmpresa) existing.porteEmpresa = record.porteEmpresa;
      if (!existing.faturamento && record.faturamento) existing.faturamento = record.faturamento;
      if (existing.faturamentoValor === null && record.faturamentoValor) existing.faturamentoValor = record.faturamentoValor;
      if (!existing.cnae && record.cnae) existing.cnae = record.cnae;
      if (!existing.situacaoCadastral && record.situacaoCadastral) existing.situacaoCadastral = record.situacaoCadastral;
      if (existing.statusEnriquecimento !== 'CONSULTADO' && record.statusEnriquecimento === 'CONSULTADO') {
        existing.statusEnriquecimento = 'CONSULTADO';
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalParticipantes - a.totalParticipantes);
}

/**
 * Export Consolidated Workbook with 7 Dedicated Tabs:
 * 1. CONSOLIDADO - Base completa de participantes com todos os atributos
 * 2. EMPRESAS_ENRIQUECIDAS - Visão corporativa deduplicada por rede/empresa
 * 3. EMPRESA_CNPJ - Mapeamento direto de Empresa x CNPJ x Situação
 * 4. CARGOS_HIERARQUIA - Sumarização por Nível Hierárquico e Setor Funcional
 * 5. DISTRIBUICAO_GEOGRAFICA - Sumarização por UF e Cidade
 * 6. ESTATISTICAS_ECONOMICAS - Sumarização por Porte, Regime e Faturamento
 * 7. AUDITORIA_QUALIDADE - Lista de registros que demandam atenção/conferência
 */
export function exportWorkbookXLSX(
  participants: ParticipantRecord[],
  filename = 'Painel_ACESU_Econodata_Consolidado_7_Abas.xlsx'
) {
  const wb = XLSX.utils.book_new();
  const companies = consolidateCompanies(participants);

  // 1. Aba CONSOLIDADO
  const rowsConsolidado = participants.map((p) => ({
    'ID Participante': p.id,
    'Nome Completo': p.nome,
    'E-mail': p.email,
    'Telefone': p.telefone,
    'DDD': p.ddd || '',
    'UF Origem (DDD)': p.ufOrigemDDD || '',
    'Cargo Declarado': p.cargo,
    'Nível Hierárquico': p.nivelHierarquico,
    'Setor Funcional': p.setorFuncional,
    'Empresa Declarada': p.empresa,
    'Empresa Padronizada': p.empresaNormalizada,
    'Cidade': p.cidade,
    'UF': p.uf,
    'CNPJ': p.cnpj,
    'Tipo (Matriz/Filial)': p.isMatriz ? 'Matriz (/0001)' : p.cnpj ? 'Filial' : '',
    'Razão Social': p.razaoSocial || '',
    'Nome Fantasia': p.nomeFantasia || '',
    'Situação Cadastral': p.situacaoCadastral || '',
    'Regime Tributário': p.regimeTributario || '',
    'Porte': p.porteEmpresa || '',
    'Faturamento Estimado': p.faturamento || '',
    'CNAE Principal': p.cnae || '',
    'Natureza Jurídica': p.naturezaJuridica || '',
    'Status Enriquecimento': p.statusEnriquecimento,
    'Origem Identificação': p.origemIdentificacao || '',
    'Observações': p.observacoes || '',
  }));
  const wsConsolidado = XLSX.utils.json_to_sheet(rowsConsolidado);
  XLSX.utils.book_append_sheet(wb, wsConsolidado, 'CONSOLIDADO');

  // 2. Aba EMPRESAS_ENRIQUECIDAS
  const rowsEmpresas = companies.map((c) => ({
    'ID Empresa': c.id,
    'Empresa Padronizada': c.nomePadronizado,
    'Empresa Original': c.nomeEmpresa,
    'Total Participantes': c.totalParticipantes,
    'CNPJ': c.cnpj,
    'Tipo': c.isMatriz ? 'Matriz (/0001)' : c.cnpj ? 'Filial' : '',
    'Razão Social': c.razaoSocial,
    'Nome Fantasia': c.nomeFantasia,
    'Situação': c.situacaoCadastral,
    'Regime Tributário': c.regimeTributario,
    'Porte': c.porteEmpresa,
    'Faturamento': c.faturamento,
    'Origem Faturamento': c.faturamentoOrigem,
    'Cidade': c.cidade,
    'UF': c.uf,
    'CNAE': c.cnae,
    'Natureza Jurídica': c.naturezaJuridica,
    'Status Econodata': c.statusEnriquecimento,
    'Origem CNPJ': c.origemIdentificacao,
    'Observações': c.observacoes,
  }));
  const wsEmpresas = XLSX.utils.json_to_sheet(rowsEmpresas);
  XLSX.utils.book_append_sheet(wb, wsEmpresas, 'EMPRESAS_ENRIQUECIDAS');

  // 3. Aba EMPRESA_CNPJ (formato direto e compacto)
  const rowsEmpresaCnpj = companies.map((c) => ({
    'Empresa': c.nomePadronizado,
    'CNPJ': c.cnpj,
    'Situação Cadastral': c.situacaoCadastral || 'ATIVA',
    'Cidade': c.cidade,
    'UF': c.uf,
    'Razão Social': c.razaoSocial || c.nomePadronizado,
    'Total Inscritos': c.totalParticipantes,
  }));
  const wsEmpresaCnpj = XLSX.utils.json_to_sheet(rowsEmpresaCnpj);
  XLSX.utils.book_append_sheet(wb, wsEmpresaCnpj, 'EMPRESA_CNPJ');

  // 4. Aba CARGOS_HIERARQUIA
  const hierarchyCounts: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};

  participants.forEach((p) => {
    hierarchyCounts[p.nivelHierarquico] = (hierarchyCounts[p.nivelHierarquico] || 0) + 1;
    sectorCounts[p.setorFuncional] = (sectorCounts[p.setorFuncional] || 0) + 1;
  });

  const totalPart = participants.length || 1;
  const rowsHierarquia: any[] = [
    { 'Categoria': '--- NÍVEL HIERÁRQUICO ---', 'Classificação': '', 'Total Participantes': '', 'Percentual (%)': '' },
    ...Object.entries(hierarchyCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([nivel, count]) => ({
        'Categoria': 'Nível Hierárquico',
        'Classificação': nivel,
        'Total Participantes': count,
        'Percentual (%)': `${((count / totalPart) * 100).toFixed(1)}%`,
      })),
    { 'Categoria': '--- SETOR FUNCIONAL ---', 'Classificação': '', 'Total Participantes': '', 'Percentual (%)': '' },
    ...Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([setor, count]) => ({
        'Categoria': 'Setor Funcional',
        'Classificação': setor,
        'Total Participantes': count,
        'Percentual (%)': `${((count / totalPart) * 100).toFixed(1)}%`,
      })),
  ];
  const wsHierarquia = XLSX.utils.json_to_sheet(rowsHierarquia);
  XLSX.utils.book_append_sheet(wb, wsHierarquia, 'CARGOS_HIERARQUIA');

  // 5. Aba DISTRIBUICAO_GEOGRAFICA
  const ufCounts: Record<string, { participantes: number; empresas: Set<string> }> = {};
  participants.forEach((p) => {
    const uf = p.uf || p.ufOrigemDDD || 'NÃO IDENTIFICADA';
    if (!ufCounts[uf]) {
      ufCounts[uf] = { participantes: 0, empresas: new Set() };
    }
    ufCounts[uf].participantes += 1;
    ufCounts[uf].empresas.add(p.empresaNormalizada);
  });

  const rowsGeografia = Object.entries(ufCounts)
    .sort((a, b) => b[1].participantes - a[1].participantes)
    .map(([uf, data]) => ({
      'Estado (UF)': uf,
      'Total Participantes': data.participantes,
      'Percentual Participantes': `${((data.participantes / totalPart) * 100).toFixed(1)}%`,
      'Total Empresas Distintas': data.empresas.size,
    }));
  const wsGeografia = XLSX.utils.json_to_sheet(rowsGeografia);
  XLSX.utils.book_append_sheet(wb, wsGeografia, 'DISTRIBUICAO_GEOGRAFICA');

  // 6. Aba ESTATISTICAS_ECONOMICAS
  const porteCounts: Record<string, number> = {};
  const regimeCounts: Record<string, number> = {};
  const situacaoCounts: Record<string, number> = {};

  companies.forEach((c) => {
    const porte = c.porteEmpresa || 'Não informado';
    porteCounts[porte] = (porteCounts[porte] || 0) + 1;

    const regime = c.regimeTributario || 'Não informado';
    regimeCounts[regime] = (regimeCounts[regime] || 0) + 1;

    const sit = c.situacaoCadastral || 'Não informada';
    situacaoCounts[sit] = (situacaoCounts[sit] || 0) + 1;
  });

  const totalComp = companies.length || 1;
  const rowsEconomicas: any[] = [
    { 'Métrica': '--- PORTE EMPRESARIAL ---', 'Segmento': '', 'Total Empresas': '', 'Participação (%)': '' },
    ...Object.entries(porteCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([porte, count]) => ({
        'Métrica': 'Porte da Empresa',
        'Segmento': porte,
        'Total Empresas': count,
        'Participação (%)': `${((count / totalComp) * 100).toFixed(1)}%`,
      })),
    { 'Métrica': '--- REGIME TRIBUTÁRIO ---', 'Segmento': '', 'Total Empresas': '', 'Participação (%)': '' },
    ...Object.entries(regimeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([regime, count]) => ({
        'Métrica': 'Regime Tributário',
        'Segmento': regime,
        'Total Empresas': count,
        'Participação (%)': `${((count / totalComp) * 100).toFixed(1)}%`,
      })),
    { 'Métrica': '--- SITUAÇÃO CADASTRAL ---', 'Segmento': '', 'Total Empresas': '', 'Participação (%)': '' },
    ...Object.entries(situacaoCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([sit, count]) => ({
        'Métrica': 'Situação Cadastral',
        'Segmento': sit,
        'Total Empresas': count,
        'Participação (%)': `${((count / totalComp) * 100).toFixed(1)}%`,
      })),
  ];
  const wsEconomicas = XLSX.utils.json_to_sheet(rowsEconomicas);
  XLSX.utils.book_append_sheet(wb, wsEconomicas, 'ESTATISTICAS_ECONOMICAS');

  // 7. Aba AUDITORIA_QUALIDADE
  const rowsAuditoria = participants
    .filter((p) => !p.cnpj || !p.email || !p.telefone || p.statusEnriquecimento === 'NAO_ENCONTRADO')
    .map((p) => ({
      'ID Participante': p.id,
      'Nome': p.nome,
      'Empresa': p.empresaNormalizada,
      'Ponto de Atenção': [
        !p.cnpj ? 'Sem CNPJ' : null,
        !p.email ? 'Sem E-mail' : null,
        !p.telefone ? 'Sem Telefone' : null,
      ]
        .filter(Boolean)
        .join('; ') || 'Pendente de validação cadastral',
      'Status Atual': p.statusEnriquecimento,
      'Observações': p.observacoes || '',
    }));

  const wsAuditoria = XLSX.utils.json_to_sheet(
    rowsAuditoria.length > 0
      ? rowsAuditoria
      : [{ 'Status': 'Base 100% íntegra - nenhum ponto crítico de atenção encontrado.' }]
  );
  XLSX.utils.book_append_sheet(wb, wsAuditoria, 'AUDITORIA_QUALIDADE');

  XLSX.writeFile(wb, filename);
}

/**
 * Independent export: Empresas Enriquecidas (.xlsx)
 */
export function exportEnrichedCompaniesXLSX(
  companies: EnrichedCompany[],
  filename = 'ACESU_Empresas_Enriquecidas.xlsx'
) {
  const wb = XLSX.utils.book_new();
  const rows = companies.map((c) => ({
    'ID Empresa': c.id,
    'Empresa Padronizada': c.nomePadronizado,
    'Empresa Original': c.nomeEmpresa,
    'Total Participantes': c.totalParticipantes,
    'CNPJ': c.cnpj,
    'Tipo': c.isMatriz ? 'Matriz (/0001)' : c.cnpj ? 'Filial' : '',
    'Razão Social': c.razaoSocial,
    'Nome Fantasia': c.nomeFantasia,
    'Situação': c.situacaoCadastral,
    'Regime Tributário': c.regimeTributario,
    'Porte': c.porteEmpresa,
    'Faturamento': c.faturamento,
    'Origem Faturamento': c.faturamentoOrigem,
    'Cidade': c.cidade,
    'UF': c.uf,
    'CNAE': c.cnae,
    'Natureza Jurídica': c.naturezaJuridica,
    'Status Econodata': c.statusEnriquecimento,
    'Origem CNPJ': c.origemIdentificacao,
    'Observações': c.observacoes,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'EMPRESAS_ENRIQUECIDAS');
  XLSX.writeFile(wb, filename);
}

/**
 * Independent export: Compact Empresa x CNPJ (.xlsx)
 */
export function exportEmpresaCnpjXLSX(
  companies: EnrichedCompany[],
  filename = 'ACESU_Empresa_CNPJ_Compacto.xlsx'
) {
  const wb = XLSX.utils.book_new();
  const rows = companies.map((c) => ({
    'Empresa': c.nomePadronizado,
    'CNPJ': c.cnpj,
    'Situação Cadastral': c.situacaoCadastral || 'ATIVA',
    'Cidade': c.cidade,
    'UF': c.uf,
    'Razão Social': c.razaoSocial || c.nomePadronizado,
    'Total Inscritos': c.totalParticipantes,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'EMPRESA_CNPJ');
  XLSX.writeFile(wb, filename);
}

export function exportSingleCSV(
  data: any[],
  filename: string
) {
  const csv = Papa.unparse(data, {
    quotes: true,
    delimiter: ';',
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

