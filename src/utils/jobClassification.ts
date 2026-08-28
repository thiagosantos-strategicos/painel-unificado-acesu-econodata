import { HierarchicalLevel, FunctionalSector } from '../types';

function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function classifyHierarchicalLevel(jobTitle: string | null | undefined): HierarchicalLevel {
  const norm = normalizeText(jobTitle);
  if (!norm) return 'Outro / Não Definido';

  // 1. C-Level / Presidência / Proprietário / Sócio
  if (
    norm.includes('ceo') ||
    norm.includes('cfo') ||
    norm.includes('coo') ||
    norm.includes('cio') ||
    norm.includes('cso') ||
    norm.includes('cro') ||
    norm.includes('presidente') ||
    norm.includes('vice-presidente') ||
    norm.includes('socio') ||
    norm.includes('socia') ||
    norm.includes('proprietario') ||
    norm.includes('proprietaria') ||
    norm.includes('dono') ||
    norm.includes('fundador') ||
    norm.includes('conselheiro') ||
    norm.includes('head of') ||
    norm.includes('diretor executivo')
  ) {
    return 'C-Level / Presidência';
  }

  // 2. Diretoria
  if (
    norm.includes('diretor') ||
    norm.includes('diretora') ||
    norm.includes('head') ||
    norm.includes('superintendente')
  ) {
    return 'Diretoria';
  }

  // 3. Gerência
  if (
    norm.includes('gerente') ||
    norm.includes('gerencia') ||
    norm.includes('manager')
  ) {
    return 'Gerência';
  }

  // 4. Coordenação / Supervisão / Liderança
  if (
    norm.includes('coordenador') ||
    norm.includes('coordenadora') ||
    norm.includes('coordenacao') ||
    norm.includes('supervisor') ||
    norm.includes('supervisora') ||
    norm.includes('supervisao') ||
    norm.includes('lider') ||
    norm.includes('lideranca') ||
    norm.includes('encarregado') ||
    norm.includes('encarregada')
  ) {
    return 'Coordenação / Supervisão';
  }

  // 5. Especialista / Consultor / Auditor Senior
  if (
    norm.includes('especialista') ||
    norm.includes('consultor') ||
    norm.includes('consultora') ||
    norm.includes('auditor') ||
    norm.includes('auditora') ||
    norm.includes('assessor') ||
    norm.includes('assessora') ||
    norm.includes('senior') ||
    norm.includes('perito')
  ) {
    return 'Especialista / Consultor';
  }

  // 6. Analista
  if (
    norm.includes('analista') ||
    norm.includes('analyst') ||
    norm.includes('pleno') ||
    norm.includes('junior')
  ) {
    return 'Analista';
  }

  // 7. Operacional / Assistente / Fiscal / Segurança
  if (
    norm.includes('assistente') ||
    norm.includes('auxiliar') ||
    norm.includes('operador') ||
    norm.includes('fiscal') ||
    norm.includes('vigilante') ||
    norm.includes('seguranca') ||
    norm.includes('inspetor') ||
    norm.includes('agente') ||
    norm.includes('tecnico') ||
    norm.includes('estagiario')
  ) {
    return 'Operacional / Assistente';
  }

  return 'Outro / Não Definido';
}

export function classifyFunctionalSector(jobTitle: string | null | undefined): FunctionalSector {
  const norm = normalizeText(jobTitle);
  if (!norm) return 'Geral / Executivo';

  // 1. Prevenção de Perdas & Riscos
  if (
    norm.includes('prevencao') ||
    norm.includes('perdas') ||
    norm.includes('risco') ||
    norm.includes('fraude') ||
    norm.includes('sinistro') ||
    norm.includes('inventario') ||
    norm.includes('quebra') ||
    norm.includes('acuracia') ||
    norm.includes('p&r') ||
    norm.includes('ppr') ||
    norm.includes('loss prevention')
  ) {
    return 'Prevenção de Perdas & Riscos';
  }

  // 2. Segurança Patrimonial & Cibernética
  if (
    norm.includes('seguranca') ||
    norm.includes('patrimonial') ||
    norm.includes('cftv') ||
    norm.includes('monitoramento') ||
    norm.includes('vigilancia') ||
    norm.includes('portaria') ||
    norm.includes('fiscal de loja') ||
    norm.includes('security')
  ) {
    return 'Segurança Patrimonial & Cibernética';
  }

  // 3. Auditoria & Compliance
  if (
    norm.includes('auditoria') ||
    norm.includes('auditor') ||
    norm.includes('compliance') ||
    norm.includes('controladoria') ||
    norm.includes('controles internos') ||
    norm.includes('governanca')
  ) {
    return 'Auditoria & Compliance';
  }

  // 4. Operações & Logística
  if (
    norm.includes('operacao') ||
    norm.includes('operacoes') ||
    norm.includes('logistica') ||
    norm.includes('loja') ||
    norm.includes('lojas') ||
    norm.includes('centro de distribuicao') ||
    norm.includes('estoque') ||
    norm.includes('cd') ||
    norm.includes('supply chain') ||
    norm.includes('abastecimento')
  ) {
    return 'Operações & Logística';
  }

  // 5. Tecnologia & Inovação
  if (
    norm.includes('ti') ||
    norm.includes('tecnologia') ||
    norm.includes('sistemas') ||
    norm.includes('dados') ||
    norm.includes('software') ||
    norm.includes('infraestrutura') ||
    norm.includes('automacao') ||
    norm.includes('it')
  ) {
    return 'Tecnologia & Inovação';
  }

  // 6. Comercial & Vendas / Compras / Trade
  if (
    norm.includes('comercial') ||
    norm.includes('vendas') ||
    norm.includes('compras') ||
    norm.includes('comprador') ||
    norm.includes('trade') ||
    norm.includes('merchandising') ||
    norm.includes('categoria') ||
    norm.includes('pricing') ||
    norm.includes('negocios')
  ) {
    return 'Comercial & Vendas';
  }

  // 7. Financeiro & Administrativo
  if (
    norm.includes('financeiro') ||
    norm.includes('contabil') ||
    norm.includes('contabilidade') ||
    norm.includes('fiscal') ||
    norm.includes('tributario') ||
    norm.includes('tesouraria') ||
    norm.includes('administrativo') ||
    norm.includes('juridico')
  ) {
    return 'Financeiro & Administrativo';
  }

  // 8. Recursos Humanos
  if (
    norm.includes('rh') ||
    norm.includes('recursos humanos') ||
    norm.includes('gente e gestao') ||
    norm.includes('treinamento') ||
    norm.includes('dp') ||
    norm.includes('pessoas')
  ) {
    return 'Recursos Humanos';
  }

  return 'Geral / Executivo';
}
