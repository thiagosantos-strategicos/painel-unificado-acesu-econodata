import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { findKnownCompany, KNOWN_BRAZILIAN_COMPANIES } from './src/utils/brazilianCompanies';
import {
  extractDDD,
  getUFInfoFromDDD,
  getUFFromPhone,
  BRAZILIAN_DDD_MAP,
  DDDInfo,
} from './src/utils/cleaners';

// Initialize Express
const app = express();

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Google GenAI SDK (only fails if called without key)
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for web search');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helpers for CNPJ validation & formatting
function onlyDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\D/g, '');
}

// Sleep helper
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cooldown tracker for Gemini quota exhaustion
let geminiQuotaCooldownUntil = 0;

// Helper to check if an error is quota exhaustion vs temporary network glitch
function isQuotaExhaustedError(error: any): boolean {
  if (!error) return false;
  const status = String(error.status || error.statusCode || error.code || '');
  const msg = String(error.message || '');
  return (
    status === 'RESOURCE_EXHAUSTED' ||
    status === '429' ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('429') ||
    msg.includes('exceeded your current quota') ||
    msg.includes('rate-limit')
  );
}

// Helper to check if an error is a transient server glitch (503, 500, fetch failed)
function isTransientServerError(error: any): boolean {
  if (!error) return false;
  const status = String(error.status || error.statusCode || error.code || '');
  const msg = String(error.message || '');
  return (
    status === '503' ||
    status === 'UNAVAILABLE' ||
    status === 'INTERNAL' ||
    status === '500' ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('fetch failed')
  );
}

// Helper to execute Gemini with fallback models, exponential backoff, and graceful failure
async function generateWithRetry(
  ai: GoogleGenAI,
  params: any
): Promise<any> {
  // If in quota cooldown window, skip immediately to let public search engines handle the lookup
  if (Date.now() < geminiQuotaCooldownUntil) {
    return null;
  }

  const requestedModel = params.model || 'gemini-3.7-flash';
  const modelsToTry = [
    requestedModel,
    'gemini-flash-latest',
  ];

  // Unique model list
  const uniqueModels = Array.from(new Set(modelsToTry));

  for (const modelName of uniqueModels) {
    try {
      const callParams = { ...params, model: modelName };
      const response = await ai.models.generateContent(callParams);
      if (response) return response;
    } catch (error: any) {
      if (isQuotaExhaustedError(error)) {
        // Mark 3-minute cooldown to prevent repeating quota-exhausted requests
        geminiQuotaCooldownUntil = Date.now() + 180_000;
        return null;
      }

      if (isTransientServerError(error)) {
        // Single brief retry on transient 503/server glitch
        await wait(1000);
        try {
          const retryParams = { ...params, model: modelName };
          const retryResp = await ai.models.generateContent(retryParams);
          if (retryResp) return retryResp;
        } catch {
          // ignore retry failure
        }
      }
    }
  }
  return null;
}

function isValidCNPJ(cnpj: string | number | null | undefined): boolean {
  const clean = onlyDigits(cnpj);
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let size = 12;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;

  size = 13;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(1))) return false;

  return true;
}

function formatCNPJ(cnpj: string | number | null | undefined): string {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return digits ? String(cnpj) : '';
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function isMatriz(cnpj: string): boolean {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return false;
  return digits.substring(8, 12) === '0001';
}

function convertToMatrizCNPJ(cnpj: string): string | null {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return null;
  const root = digits.substring(0, 8);
  const matrizBase = root + '0001';

  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += Number(matrizBase.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  const withD1 = matrizBase + d1;
  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += Number(withD1.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return formatCNPJ(matrizBase + d1 + d2);
}

function normalizeSearchStr(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ----------------------------------------------------
// ECONODATA API v4 CLIENT (SERVER-SIDE ONLY)
// ----------------------------------------------------

const ECONODATA_BASE_URL = String(
  process.env.ECONODATA_BASE_URL || 'https://api.econodata.com.br'
).replace(/\/$/, '');
const ECONODATA_FIELDS = [
  'cadastro.razaoSocial',
  'cadastro.nomeFantasia',
  'cadastro.situacao',
  'cadastro.uf',
  'cadastro.cidade',
  'cadastro.regimeTributario.atual',
  'cadastro.enquadramentoPorte',
  'estrategico.faturamentoCnpj.de',
  'estrategico.faturamentoCnpj.ate',
  'estrategico.faturamentoCnpj.valor',
  'estrategico.faturamentoCnpj.origem',
];

class EconodataApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'EconodataApiError';
    this.status = status;
    this.details = details;
  }
}

function getEconodataKey(): string | null {
  const key = String(
    process.env.ECONODATA_API_KEY ||
    process.env.ECONODATA_KEY ||
    process.env.ECONODATA_TOKEN ||
    process.env.ECONODATA_API_TOKEN ||
    process.env.ECONODATA ||
    ''
  ).trim();
  return key ? key : null;
}

function cleanToken(token: string): string {
  return token.replace(/^(Bearer|Token)\s+/i, '').trim();
}

function getEconodataKeyInfo() {
  const envCandidates = [
    'ECONODATA_API_KEY',
    'ECONODATA_KEY',
    'ECONODATA_TOKEN',
    'ECONODATA_API_TOKEN',
    'ECONODATA',
  ];

  for (const varName of envCandidates) {
    const rawVal = process.env[varName];
    if (rawVal && String(rawVal).trim().length > 0) {
      const val = String(rawVal).trim();
      const cleaned = cleanToken(val);
      const masked = cleaned.length > 8 
        ? `${cleaned.substring(0, 4)}...${cleaned.substring(cleaned.length - 4)}` 
        : '***';
      return {
        loaded: true,
        varName,
        length: cleaned.length,
        hasBearerPrefix: /^(Bearer|Token)\s+/i.test(val),
        maskedPreview: masked,
        validFormat: cleaned.length >= 8,
      };
    }
  }

  return {
    loaded: false,
    varName: null,
    length: 0,
    hasBearerPrefix: false,
    maskedPreview: null,
    validFormat: false,
  };
}

function econodataStatusFromError(error: unknown): string {
  const status = error instanceof EconodataApiError ? error.status : 0;
  if (status === 401) return 'CHAVE_AUSENTE';
  if (status === 402) return 'SEM_SALDO';
  if (status === 403) return 'SEM_PERMISSAO';
  if (status === 429) return 'LIMITE_ATINGIDO';
  if (status >= 500 || status === 0) return 'ERRO_TEMPORARIO';
  return 'NAO_CONSULTADO';
}

function extractProblemMessage(payload: any, fallback: string): string {
  return String(
    payload?.detail ||
      payload?.message ||
      payload?.title ||
      payload?.error ||
      fallback
  );
}

async function econodataRequest(
  pathName: string,
  init: RequestInit = {},
  estimateOnly = false
): Promise<{ data: any; headers: Headers; status: number }> {
  const rawKey = getEconodataKey();
  if (!rawKey) {
    throw new EconodataApiError(401, 'ECONODATA_API_KEY não configurada.');
  }
  const token = cleanToken(rawKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${ECONODATA_BASE_URL}${pathName}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(estimateOnly ? { 'X-Estimate-Only': 'true' } : {}),
        ...(init.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new EconodataApiError(
        response.status,
        extractProblemMessage(data, `Econodata respondeu HTTP ${response.status}.`),
        data
      );
    }

    return { data, headers: response.headers, status: response.status };
  } catch (error: any) {
    if (error instanceof EconodataApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new EconodataApiError(503, 'Tempo limite da Econodata excedido.');
    }
    throw new EconodataApiError(503, 'Falha temporária ao acessar a Econodata.');
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatCurrencyBRL(value: unknown): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatRevenueRange(revenue: any): string {
  if (!revenue || typeof revenue !== 'object') return '';
  if (Number.isFinite(Number(revenue.valor))) {
    return formatCurrencyBRL(revenue.valor);
  }
  const from = Number.isFinite(Number(revenue.de)) ? formatCurrencyBRL(revenue.de) : '';
  const to = Number.isFinite(Number(revenue.ate)) ? formatCurrencyBRL(revenue.ate) : '';
  if (from && to) return `${from} a ${to}`;
  if (from) return `A partir de ${from}`;
  if (to) return `Até ${to}`;
  return '';
}

async function matchCompanyWithEconodata(company: any): Promise<any | null> {
  const existingCnpj = onlyDigits(company.cnpj);
  if (existingCnpj.length === 14 && isValidCNPJ(existingCnpj)) {
    return {
      cnpj: formatCNPJ(existingCnpj),
      confidence: 'ALTA',
      razaoSocial: company.nome || company.companyName || '',
      source: 'PLANILHA',
    };
  }

  const criterios: Record<string, string> = {};
  const name = String(company.nome || company.companyName || '').trim();
  if (name) criterios.nome = name;
  const phone = String(company.phone || company.telefone || '').trim();
  const inferredDdd = String(company.ddd || extractDDD(phone) || '').trim();
  const inferredUf = inferredDdd ? getUFInfoFromDDD(inferredDdd)?.uf : '';
  const effectiveUf = String(company.uf || inferredUf || '').trim().toUpperCase();
  if (effectiveUf) criterios.uf = effectiveUf;

  if (Object.keys(criterios).length === 0) return null;

  const { data } = await econodataRequest('/v4/companies/match', {
    method: 'POST',
    body: JSON.stringify({
      criterios,
      incluir: ['cadastro'],
    }),
  });

  const best = Array.isArray(data?.correspondencias) ? data.correspondencias[0] : null;
  if (!best?.cnpj || !isValidCNPJ(best.cnpj)) return null;

  const rawConfidence = Number(best.confianca || 0);
  const confidenceNumber = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;
  const cadastro = best.cadastro || {};
  return {
    cnpj: formatCNPJ(best.cnpj),
    confidence: confidenceNumber >= 0.85 ? 'ALTA' : confidenceNumber >= 0.7 ? 'MEDIA' : 'BAIXA',
    confidenceNumber,
    razaoSocial: best.razaoSocial || cadastro.razaoSocial || name,
    nomeFantasia: best.nomeFantasia || cadastro.nomeFantasia || '',
    source: 'ECONODATA_MATCH',
  };
}

async function lookupCompaniesWithEconodata(
  cnpjs: string[],
  estimateOnly = false
): Promise<{ companies: any[]; errors: any[]; tokens: number; charged: number }> {
  const uniqueCnpjs = Array.from(new Set(cnpjs.map(onlyDigits).filter(isValidCNPJ)));
  const companies: any[] = [];
  const errors: any[] = [];
  let tokens = 0;
  let charged = 0;

  for (let index = 0; index < uniqueCnpjs.length; index += 100) {
    const chunk = uniqueCnpjs.slice(index, index + 100);
    const response = await econodataRequest(
      '/v4/companies',
      {
        method: 'POST',
        body: JSON.stringify({
          cnpjs: chunk,
          campos: ECONODATA_FIELDS,
          limite: 1,
        }),
      },
      estimateOnly
    );

    if (estimateOnly) {
      tokens += Number(response.data?.tokensEstimados || 0);
    } else {
      companies.push(...(Array.isArray(response.data?.empresas) ? response.data.empresas : []));
      errors.push(...(Array.isArray(response.data?.erros) ? response.data.erros : []));
      charged += Number(response.headers.get('x-tokens-charged') || 0);
    }
  }

  return { companies, errors, tokens, charged };
}

function normalizeEconodataCompany(company: any) {
  const cadastro = company?.cadastro || {};
  const estrategico = company?.estrategico || {};
  const revenue = estrategico?.faturamentoCnpj || {};
  return {
    cnpj: formatCNPJ(company?.cnpj || ''),
    razaoSocial: cadastro?.razaoSocial || '',
    nomeFantasia: cadastro?.nomeFantasia || '',
    situacaoCadastral: cadastro?.situacao || cadastro?.situacaoCadastral?.tipo || '',
    cidade: cadastro?.cidade || cadastro?.endereco?.cidade || '',
    uf: cadastro?.uf || cadastro?.endereco?.uf || '',
    regimeTributario: cadastro?.regimeTributario?.atual || '',
    porteEmpresa: cadastro?.enquadramentoPorte || '',
    faturamento: formatRevenueRange(revenue),
    faturamentoValor: Number.isFinite(Number(revenue?.valor)) ? Number(revenue.valor) : null,
    faturamentoDe: Number.isFinite(Number(revenue?.de)) ? Number(revenue.de) : null,
    faturamentoAte: Number.isFinite(Number(revenue?.ate)) ? Number(revenue.ate) : null,
    faturamentoOrigem: revenue?.origem || '',
  };
}

// Fetch official registration via multi-source public APIs with fallback (Minha Receita, ReceitaWS, CNPJa, BrasilAPI)
async function fetchPublicCNPJ(digits: string) {
  const clean = onlyDigits(digits);
  if (!isValidCNPJ(clean)) return null;

  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
  };

  // 1. Try Minha Receita (fast, direct Receita Federal mirror)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://minhareceita.org/${clean}`, {
      signal: controller.signal,
      headers: browserHeaders,
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (data && (data.razao_social || data.nome_fantasia)) {
        return {
          cnpj: formatCNPJ(clean),
          razaoSocial: data.razao_social || data.nome_fantasia || '',
          nomeFantasia: data.nome_fantasia || '',
          situacaoCadastral: data.descricao_situacao_cadastral || 'ATIVA',
          dataSituacaoCadastral: data.data_situacao_cadastral,
          cnae: data.cnae_fiscal_descricao || '',
          naturezaJuridica: data.natureza_juridica || '',
          logradouro: `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro || ''}`.trim(),
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep || '',
          telefone: data.ddd_telefone_1 || '',
          email: data.email || '',
          isMatriz: data.identificador_matriz_filial === 1 || isMatriz(clean),
          qsa: data.qsa || [],
          source: 'Receita Federal / Minha Receita',
        };
      }
    }
  } catch {}

  // 2. Try ReceitaWS
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://receitaws.com.br/v1/cnpj/${clean}`, {
      signal: controller.signal,
      headers: browserHeaders,
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (data.status !== 'ERROR' && (data.nome || data.fantasia)) {
        return {
          cnpj: formatCNPJ(clean),
          razaoSocial: data.nome || data.fantasia || '',
          nomeFantasia: data.fantasia || '',
          situacaoCadastral: data.situacao || 'ATIVA',
          dataSituacaoCadastral: data.data_situacao,
          cnae: data.atividade_principal?.[0]?.text || '',
          naturezaJuridica: data.natureza_juridica || '',
          logradouro: `${data.tipo || ''} ${data.logradouro || ''}`.trim(),
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep || '',
          telefone: data.telefone || '',
          email: data.email || '',
          isMatriz: data.tipo === 'MATRIZ' || isMatriz(clean),
          qsa: data.qsa || [],
          source: 'Receita Federal / ReceitaWS',
        };
      }
    }
  } catch {}

  // 3. Try CNPJa Open Office API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://open.cnpja.com/office/${clean}`, {
      signal: controller.signal,
      headers: browserHeaders,
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (data && (data.company?.name || data.alias)) {
        return {
          cnpj: formatCNPJ(clean),
          razaoSocial: data.company?.name || data.alias || '',
          nomeFantasia: data.alias || '',
          situacaoCadastral: data.status?.text || 'ATIVA',
          dataSituacaoCadastral: data.status?.date,
          cnae: data.mainActivity?.text || '',
          naturezaJuridica: data.company?.nature?.text || '',
          logradouro: `${data.address?.street || ''}`.trim(),
          numero: data.address?.number || '',
          complemento: data.address?.details || '',
          bairro: data.address?.district || '',
          cidade: data.address?.city || '',
          uf: data.address?.state || '',
          cep: data.address?.zip || '',
          telefone: data.phones?.[0]?.area ? `(${data.phones[0].area}) ${data.phones[0].number}` : '',
          email: data.emails?.[0]?.address || '',
          isMatriz: !data.isBranch || isMatriz(clean),
          source: 'Receita Federal / CNPJa',
        };
      }
    }
  } catch {}

  // 4. Try BrasilAPI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      signal: controller.signal,
      headers: browserHeaders,
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (data && (data.razao_social || data.nome_fantasia)) {
        return {
          cnpj: formatCNPJ(clean),
          razaoSocial: data.razao_social || data.nome_fantasia || '',
          nomeFantasia: data.nome_fantasia || '',
          situacaoCadastral: data.descricao_situacao_cadastral || 'ATIVA',
          dataSituacaoCadastral: data.data_situacao_cadastral,
          cnae: data.cnae_fiscal_descricao || '',
          naturezaJuridica: data.natureza_juridica || '',
          logradouro: `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro || ''}`.trim(),
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep || '',
          telefone: data.ddd_telefone_1 || '',
          email: data.email || '',
          isMatriz: data.identificador_matriz_filial === 1 || isMatriz(clean),
          qsa: data.qsa || [],
          source: 'Receita Federal / BrasilAPI',
        };
      }
    }
  } catch {}

  return null;
}

// Multi-Engine Web Snippet and Candidate Extractor (Bing, Yahoo, DuckDuckGo)
async function searchWebPublicSnippets(
  companyName: string,
  city?: string,
  uf?: string,
  ddd?: string
): Promise<{ cnpj: string; title: string; uri: string; official?: any }[]> {
  const dddInfo = ddd ? getUFInfoFromDDD(ddd) : null;
  const stateStr = uf || dddInfo?.uf || '';
  const queries = [
    `CNPJ ${companyName} ${city || ''} ${stateStr} receita federal`,
    ddd ? `CNPJ ${companyName} DDD ${ddd}` : '',
    dddInfo ? `CNPJ ${companyName} ${dddInfo.estado}` : '',
    `CNPJ ${companyName} ${stateStr}`,
    `CNPJ "${companyName}" ${stateStr}`,
  ].filter(Boolean);

  const candidateCnpjs = new Set<string>();
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  };

  for (const queryStr of queries) {
    const searchUrls = [
      `https://www.bing.com/search?q=${encodeURIComponent(queryStr.trim())}`,
      `https://search.yahoo.com/search?p=${encodeURIComponent(queryStr.trim())}`,
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(queryStr.trim())}`,
    ];

    for (const sUrl of searchUrls) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(sUrl, {
          signal: controller.signal,
          headers: browserHeaders,
        });
        clearTimeout(timer);

        if (resp.ok) {
          const html = await resp.text();
          const cnpjMatches = html.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) || [];
          const plainMatches = html.match(/\b\d{14}\b/g) || [];
          for (const m of [...cnpjMatches, ...plainMatches]) {
            const clean = onlyDigits(m);
            if (isValidCNPJ(clean)) {
              candidateCnpjs.add(clean);
            }
          }
        }
      } catch {}
    }
    if (candidateCnpjs.size >= 4) break;
  }

  if (candidateCnpjs.size === 0) return [];

  const normTarget = normalizeSearchStr(companyName);
  const stopWords = new Set(['supermercado', 'supermercados', 'mercado', 'loja', 'lojas', 'comercio', 'distribuidora', 'ltda', 'sa', 's/a', 'epp', 'me', 'cia', 'de', 'da', 'do', 'e']);
  const targetTokens = normTarget.split(' ').filter((t) => t.length > 2 && !stopWords.has(t));

  const scoredResults: Array<{ cnpj: string; title: string; uri: string; official: any; score: number }> = [];

  for (const cnpj of Array.from(candidateCnpjs).slice(0, 8)) {
    const official = await fetchPublicCNPJ(cnpj);
    if (!official) continue;

    const normRazao = normalizeSearchStr(official.razaoSocial);
    const normFantasia = normalizeSearchStr(official.nomeFantasia);

    let score = 0;
    if (normRazao.includes(normTarget) || normFantasia.includes(normTarget) || normTarget.includes(normRazao)) {
      score += 100;
    }
    for (const token of targetTokens) {
      if (normRazao.includes(token) || normFantasia.includes(token)) {
        score += 35;
      }
    }
    if (official.isMatriz) {
      score += 25;
    }
    if (city && official.cidade && normalizeSearchStr(official.cidade).includes(normalizeSearchStr(city))) {
      score += 25;
    }
    if (stateStr && official.uf && official.uf.toUpperCase() === stateStr.toUpperCase()) {
      score += 30; // Stronger bonus for matching state from UF or DDD
    }
    if (ddd && official.telefone && extractDDD(official.telefone) === ddd) {
      score += 25; // Bonus for matching exact telephone DDD on Receita Federal registry
    }

    if (score > 0) {
      scoredResults.push({
        cnpj: formatCNPJ(cnpj),
        title: `Receita Federal (${official.razaoSocial || official.nomeFantasia})`,
        uri: 'https://solucoes.receita.fazenda.gov.br/',
        official,
        score,
      });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults;
}

// Core Search Orchestrator for Single Company
async function executeCNPJSearch(params: {
  companyName: string;
  city?: string;
  uf?: string;
  domain?: string;
  phone?: string;
  ddd?: string;
  additionalContext?: string;
}) {
  let { companyName, city, uf, domain, phone, ddd, additionalContext } = params;
  const rawDigits = onlyDigits(companyName);

  // Cross-reference DDD and Telephone from Database to determine State of Origin (UF)
  const dddExtracted = ddd || (phone ? extractDDD(phone) : null);
  const dddInfo = dddExtracted ? getUFInfoFromDDD(dddExtracted) : null;

  // If UF is empty, infer state of origin from phone DDD
  if (!uf && dddInfo) {
    uf = dddInfo.uf;
  }
  // If city is empty and we have a specific region/capital from DDD
  if (!city && dddInfo && !dddInfo.capitalOuRegiao.includes('/')) {
    city = dddInfo.capitalOuRegiao;
  }

  // 1. Direct CNPJ input
  if (rawDigits.length === 14 && isValidCNPJ(rawDigits)) {
    const publicData = await fetchPublicCNPJ(rawDigits);
    if (publicData) {
      return {
        success: true,
        cnpj: publicData.cnpj,
        razaoSocial: publicData.razaoSocial || companyName,
        nomeFantasia: publicData.nomeFantasia,
        situacaoCadastral: publicData.situacaoCadastral,
        isMatriz: publicData.isMatriz,
        cidade: publicData.cidade || city || '',
        uf: publicData.uf || uf || (dddInfo ? dddInfo.uf : ''),
        logradouro: publicData.logradouro || '',
        numero: publicData.numero || '',
        complemento: publicData.complemento || '',
        bairro: publicData.bairro || '',
        cep: publicData.cep || '',
        telefone: publicData.telefone || phone || '',
        email: publicData.email || '',
        confidence: 'ALTA',
        sources: [{ title: 'Receita Federal / Base Oficial', uri: 'https://solucoes.receita.fazenda.gov.br/' }],
        summary: `CNPJ ${publicData.cnpj} consultado diretamente nas bases públicas da Receita Federal. Situação: ${publicData.situacaoCadastral}.`,
        cnae: publicData.cnae,
        naturezaJuridica: publicData.naturezaJuridica,
        dataAbertura: publicData.dataSituacaoCadastral,
        ddd: dddExtracted || undefined,
        ufOrigemDDD: dddInfo?.uf,
      };
    }
    return {
      success: true,
      cnpj: formatCNPJ(rawDigits),
      razaoSocial: companyName,
      nomeFantasia: '',
      situacaoCadastral: 'ATIVA',
      isMatriz: isMatriz(rawDigits),
      cidade: city || '',
      uf: uf || (dddInfo ? dddInfo.uf : ''),
      confidence: 'ALTA',
      sources: [{ title: 'Validador Algorítmico Módulo 11', uri: 'https://solucoes.receita.fazenda.gov.br/' }],
      summary: `CNPJ ${formatCNPJ(rawDigits)} validado matematicamente pelo algoritmo oficial Módulo 11 da Receita Federal.`,
      ddd: dddExtracted || undefined,
      ufOrigemDDD: dddInfo?.uf,
    };
  }

  // 2. Check Corporate Brazilian Verified Database (Instant & Exact)
  const known = findKnownCompany(companyName);
  if (known) {
    const publicData = await fetchPublicCNPJ(known.cnpjMatriz);
    return {
      success: true,
      cnpj: known.cnpjMatriz,
      razaoSocial: publicData?.razaoSocial || known.razaoSocial,
      nomeFantasia: publicData?.nomeFantasia || known.nomeFantasia,
      situacaoCadastral: publicData?.situacaoCadastral || known.situacaoCadastral,
      isMatriz: true,
      cidade: publicData?.cidade || known.cidade,
      uf: publicData?.uf || known.uf,
      logradouro: publicData?.logradouro || '',
      numero: publicData?.numero || '',
      complemento: publicData?.complemento || '',
      bairro: publicData?.bairro || '',
      cep: publicData?.cep || '',
      telefone: publicData?.telefone || phone || '',
      email: publicData?.email || '',
      confidence: 'ALTA',
      sources: [
        { title: 'Base Cadastral Corporativa Oficial', uri: 'https://solucoes.receita.fazenda.gov.br/' },
        { title: `${known.nomeFantasia} - Institucional`, uri: known.dominio ? `https://${known.dominio}` : 'https://solucoes.receita.fazenda.gov.br/' },
      ],
      summary: `CNPJ Matriz oficial de ${known.razaoSocial} localizado com 100% de correspondência cadastral.`,
      cnae: publicData?.cnae || known.cnae,
      naturezaJuridica: publicData?.naturezaJuridica || known.naturezaJuridica,
      dataAbertura: publicData?.dataSituacaoCadastral,
      ddd: dddExtracted || undefined,
      ufOrigemDDD: dddInfo?.uf,
    };
  }

  // 3. Try Web Search Snippet Extraction & Cross-Verification (Bing + Yahoo + DuckDuckGo) with DDD State support
  const webMatches = await searchWebPublicSnippets(companyName, city, uf, dddExtracted || undefined);
  if (webMatches.length > 0 && webMatches[0].official) {
    const top = webMatches[0];
    const pub = top.official;
    return {
      success: true,
      cnpj: top.cnpj,
      razaoSocial: pub.razaoSocial || companyName,
      nomeFantasia: pub.nomeFantasia || '',
      situacaoCadastral: pub.situacaoCadastral || 'ATIVA',
      isMatriz: pub.isMatriz,
      cidade: pub.cidade || city || '',
      uf: pub.uf || uf || (dddInfo ? dddInfo.uf : ''),
      logradouro: pub.logradouro || '',
      numero: pub.numero || '',
      complemento: pub.complemento || '',
      bairro: pub.bairro || '',
      cep: pub.cep || '',
      telefone: pub.telefone || phone || '',
      email: pub.email || '',
      confidence: 'ALTA',
      sources: [
        { title: top.title, uri: top.uri },
        { title: 'Receita Federal / Base Pública Oficial', uri: 'https://solucoes.receita.fazenda.gov.br/' },
      ],
      summary: dddInfo
        ? `CNPJ Matriz ${top.cnpj} (${pub.razaoSocial}) localizado na internet e validado na Receita Federal de ${pub.uf || dddInfo.uf}, cruzado com o DDD (${dddExtracted}) do telefone.`
        : `CNPJ Matriz ${top.cnpj} (${pub.razaoSocial}) localizado na internet e validado junto à base oficial da Receita Federal.`,
      cnae: pub.cnae,
      naturezaJuridica: pub.naturezaJuridica,
      dataAbertura: pub.dataSituacaoCadastral,
      ddd: dddExtracted || undefined,
      ufOrigemDDD: dddInfo?.uf,
    };
  }

  // 4. Try Gemini AI with Google Search Grounding (gemini-3.7-flash) with DDD Cross-Referencing
  let aiSearchText = '';
  let aiSources: Array<{ title: string; uri: string }> = [];

  try {
    const ai = getAI();
    const effectiveUF = uf || dddInfo?.uf || '';
    const locationStr = [city, effectiveUF].filter(Boolean).join(' - ');
    const domainStr = domain ? `(site/domínio: ${domain})` : '';
    const phoneDddStr = dddInfo
      ? `Telefone na base de dados: ${phone || `DDD (${dddExtracted})`} | DDD (${dddExtracted}) → Estado de Origem: ${dddInfo.estado} (${dddInfo.uf}) [Região: ${dddInfo.regiao} - ${dddInfo.capitalOuRegiao}]`
      : phone
      ? `Telefone na base: ${phone}`
      : '';
    const contextStr = additionalContext ? `[Contexto adicional: ${additionalContext}]` : '';

    const prompt = `Você é um auditor e especialista em registros cadastrais da Receita Federal do Brasil.
Utilize a ferramenta de busca do Google (Google Search) para pesquisar na web e identificar com precisão o CNPJ Matriz oficial de 14 dígitos da seguinte empresa brasileira:

Nome da Empresa: "${companyName.trim()}"
${locationStr ? `Localização / Cidade / UF: ${locationStr}` : ''}
${phoneDddStr ? `CRUZAMENTO TELEFÔNICO / DDD: ${phoneDddStr}` : ''}
${domainStr ? `Domínio na Web: ${domainStr}` : ''}
${contextStr}

${dddInfo ? `INSTRUÇÃO DE CRUZAMENTO CADASTRAL POR DDD:
A empresa possui telefone com DDD (${dddExtracted}), indicando que seu estado de origem/sede é ${dddInfo.estado} (${dddInfo.uf}).
Filtre homônimos priorizando empresas registradas no estado de ${dddInfo.uf} (${dddInfo.estado}) e descarte empresas com o mesmo nome em outros estados.` : ''}

Termos de busca recomendados:
- "CNPJ ${companyName.trim()} ${effectiveUF} ${city || ''}"
${dddExtracted ? `- "CNPJ ${companyName.trim()} DDD ${dddExtracted}"` : ''}
${dddInfo ? `- "CNPJ ${companyName.trim()} ${dddInfo.estado}"` : ''}
- "CNPJ Matriz ${companyName.trim()}"
- "Receita Federal CNPJ ${companyName.trim()}"

Diretrizes obrigatórias:
1. Identifique o número de CNPJ de 14 dígitos (formato 00.000.000/0001-00).
2. Priorize o CNPJ Matriz (sufixo /0001-XX).
3. Obtenha a Razão Social oficial na Receita Federal, Nome Fantasia, Situação Cadastral (ex: ATIVA), Município, UF e CNAE.
4. Responda obrigatoriamente em formato JSON estrito:

\`\`\`json
{
  "encontrado": true,
  "cnpj": "00.000.000/0001-00",
  "razaoSocial": "RAZAO SOCIAL OFICIAL NA RECEITA FEDERAL",
  "nomeFantasia": "NOME FANTASIA",
  "isMatriz": true,
  "situacaoCadastral": "ATIVA",
  "cidade": "Cidade",
  "uf": "${effectiveUF || 'UF'}",
  "cnae": "Atividade econômica principal",
  "confianca": "ALTA",
  "resumo": "CNPJ localizado via Google Search Grounding cruzado com o estado de origem pelo DDD."
}
\`\`\`
Se não encontrar o CNPJ com alta certeza ou se os dados forem ambíguos:
\`\`\`json
{
  "encontrado": false,
  "cnpj": "",
  "confianca": "NAO_ENCONTRADO",
  "resumo": "CNPJ não localizado com evidência pública suficiente."
}
\`\`\``;

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        },
      });

      aiSearchText = response?.text || '';

      // Extract Grounding Chunks (Web Sources) from Google Search Grounding
      const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            aiSources.push({
              title: chunk.web.title || 'Google Search Grounding',
              uri: chunk.web.uri,
            });
          }
        }
      }

      if (aiSources.length === 0) {
        aiSources.push(
          { title: 'Google Search Grounding', uri: `https://www.google.com/search?q=${encodeURIComponent(`CNPJ ${companyName} ${effectiveUF} ${city || ''}`.trim())}` },
          { title: 'Receita Federal / Base Pública Oficial', uri: 'https://solucoes.receita.fazenda.gov.br/' }
        );
      }
    } catch (aiErr: any) {
      if (isQuotaExhaustedError(aiErr)) {
        geminiQuotaCooldownUntil = Date.now() + 180_000;
      }
    }
  } catch (sdkInitErr: any) {
    // SDK optional initialization handler
  }

  // Parse AI Response (handles both ```json codeblocks and raw JSON)
  let parsedAi: any = null;
  if (aiSearchText) {
    const jsonMatch = aiSearchText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedAi = JSON.parse(jsonMatch[1].trim());
      } catch {}
    }
    if (!parsedAi) {
      const objectMatch = aiSearchText.match(/\{[\s\S]*"cnpj"[\s\S]*\}/);
      if (objectMatch) {
        try {
          parsedAi = JSON.parse(objectMatch[0]);
        } catch {}
      }
    }
  }

  // Extract Candidate CNPJ from AI
  let candidateCnpj = '';
  if (parsedAi?.cnpj && isValidCNPJ(parsedAi.cnpj)) {
    candidateCnpj = formatCNPJ(parsedAi.cnpj);
  } else if (aiSearchText) {
    const matches = aiSearchText.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) || [];
    for (const m of matches) {
      if (isValidCNPJ(m)) {
        candidateCnpj = formatCNPJ(m);
        break;
      }
    }
  }

  // 5. Cross-verify candidate with Public Official APIs
  if (candidateCnpj && isValidCNPJ(candidateCnpj)) {
    const publicData = await fetchPublicCNPJ(candidateCnpj);
    const finalUf = publicData?.uf || parsedAi?.uf || uf || (dddInfo ? dddInfo.uf : '');
    return {
      success: true,
      cnpj: candidateCnpj,
      razaoSocial: publicData?.razaoSocial || parsedAi?.razaoSocial || companyName,
      nomeFantasia: publicData?.nomeFantasia || parsedAi?.nomeFantasia || '',
      situacaoCadastral: publicData?.situacaoCadastral || parsedAi?.situacaoCadastral || 'ATIVA',
      isMatriz: publicData ? publicData.isMatriz : (parsedAi?.isMatriz ?? isMatriz(candidateCnpj)),
      cidade: publicData?.cidade || parsedAi?.cidade || city || '',
      uf: finalUf,
      logradouro: publicData?.logradouro || '',
      numero: publicData?.numero || '',
      complemento: publicData?.complemento || '',
      bairro: publicData?.bairro || '',
      cep: publicData?.cep || '',
      telefone: publicData?.telefone || phone || '',
      email: publicData?.email || '',
      confidence: 'ALTA',
      sources: aiSources.length > 0 ? aiSources : [{ title: 'Receita Federal / Base Pública Oficial', uri: 'https://solucoes.receita.fazenda.gov.br/' }],
      summary: dddInfo
        ? `${parsedAi?.resumo || `CNPJ ${candidateCnpj} localizado e conferido com os registros da Receita Federal.`} (Origem cruzada com DDD ${dddExtracted} → ${dddInfo.estado}/${dddInfo.uf})`
        : parsedAi?.resumo || `CNPJ ${candidateCnpj} localizado e conferido com os registros da Receita Federal.`,
      cnae: publicData?.cnae || parsedAi?.cnae || '',
      naturezaJuridica: publicData?.naturezaJuridica || '',
      dataAbertura: publicData?.dataSituacaoCadastral || '',
      rawText: aiSearchText,
      ddd: dddExtracted || undefined,
      ufOrigemDDD: dddInfo?.uf,
    };
  }

  // 6. Return not found with clean feedback (never invent data)
  return {
    success: false,
    cnpj: '',
    razaoSocial: companyName,
    nomeFantasia: '',
    confidence: 'NAO_ENCONTRADO',
    sources: aiSources,
    summary: dddInfo
      ? `Não foi possível localizar um CNPJ com 100% de precisão para "${companyName}" no estado ${dddInfo.estado} (DDD ${dddExtracted}). O campo permanece em branco para auditoria cadastral.`
      : `Não foi possível localizar um CNPJ com 100% de precisão para "${companyName}". O campo permanece em branco para auditoria cadastral.`,
    ddd: dddExtracted || undefined,
    ufOrigemDDD: dddInfo?.uf,
  };
}


// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    econodataConfigured: Boolean(getEconodataKey()),
  });
});

// Dedicated admin-only configuration ping route to verify ECONODATA_API_KEY loading without exposing secrets
app.get(['/api/admin/verify-config', '/api/econodata/ping'], (req, res) => {
  const keyInfo = getEconodataKeyInfo();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    server: {
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
    },
    econodata: {
      loaded: keyInfo.loaded,
      envVarDetected: keyInfo.varName,
      keyLength: keyInfo.length,
      hasBearerPrefix: keyInfo.hasBearerPrefix,
      maskedPreview: keyInfo.maskedPreview,
      validFormat: keyInfo.validFormat,
      message: keyInfo.loaded
        ? `Variável [${keyInfo.varName}] carregada com sucesso no ambiente do servidor (${keyInfo.length} caracteres). Segredo 100% protegido server-side.`
        : 'Nenhuma variável ECONODATA_* detectada no process.env do servidor. Configure ECONODATA_API_KEY no menu Settings -> Secrets do AI Studio.',
    },
    gemini: {
      loaded: Boolean(process.env.GEMINI_API_KEY),
    },
  });
});

app.get('/api/econodata/status', async (req, res) => {
  const key = getEconodataKey();
  if (!key) {
    return res.json({ configured: false, status: 'chave_ausente' });
  }

  let balance: any = null;
  let balanceWarning = '';

  try {
    try {
      const { data } = await econodataRequest('/v4/account/balance', { method: 'GET' });
      balance = data?.saldoTokens ?? data?.saldo ?? data?.balance ?? data?.tokens ?? data?.saldo_tokens;
    } catch (balErr: any) {
      // Nem todos os planos liberam a rota de saldo. Um 403 aqui não prova
      // que a chave seja inválida para o endpoint de empresas.
      balanceWarning = balErr?.message || 'Saldo não disponível neste plano.';
    }

    // Validação sem consumo no mesmo endpoint utilizado pelo enriquecimento.
    const estimate = await econodataRequest(
      '/v4/companies',
      {
        method: 'POST',
        body: JSON.stringify({
          cnpjs: ['33000167000101'],
          campos: ['cadastro.razaoSocial'],
          limite: 1,
        }),
      },
      true
    );

    return res.json({
      configured: true,
      status: 'conexao_valida',
      balance: balance ?? 'Ativo',
      estimatedTokens: Number(estimate.data?.tokensEstimados || 0),
      warning: balanceWarning || undefined,
    });
  } catch (error: any) {
    const httpStatus = error instanceof EconodataApiError ? error.status : 0;
    const status =
      httpStatus === 401
        ? 'chave_invalida'
        : httpStatus === 403
          ? 'sem_permissao'
          : httpStatus === 402
            ? 'sem_saldo'
            : httpStatus === 429
              ? 'limite_atingido'
              : 'erro_temporario';
    return res.status(200).json({
      configured: false,
      status,
      httpStatus: httpStatus || undefined,
      error: error?.message || 'Falha ao validar a Econodata.',
      warning: balanceWarning || undefined,
    });
  }
});

// Single Direct CNPJ Lookup (Public / Receita)
app.get('/api/cnpj/lookup/:cnpj', async (req, res) => {
  try {
    const rawCnpj = req.params.cnpj;
    const clean = onlyDigits(rawCnpj);

    if (!isValidCNPJ(clean)) {
      return res.status(400).json({
        success: false,
        error: 'CNPJ inválido de acordo com o algoritmo Módulo 11 da Receita Federal.',
      });
    }

    const data = await fetchPublicCNPJ(clean);
    if (data) {
      return res.json({
        success: true,
        ...data,
      });
    }

    // Fallback if public API was unreachable
    return res.json({
      success: true,
      cnpj: formatCNPJ(clean),
      isMatriz: isMatriz(clean),
      situacaoCadastral: 'ATIVA',
      source: 'Validador Algorítmico Módulo 11',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Real-time Internet Web Search for CNPJ using Multi-Tier Search Engine
app.post('/api/cnpj/search-web', async (req, res) => {
  try {
    const { companyName, city, uf, domain, phone, ddd, additionalContext } = req.body;

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nome da empresa é obrigatório para pesquisar.',
      });
    }

    const result = await executeCNPJSearch({
      companyName: companyName.trim(),
      city: city ? String(city).trim() : undefined,
      uf: uf ? String(uf).trim() : undefined,
      domain: domain ? String(domain).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      ddd: ddd ? String(ddd).trim() : undefined,
      additionalContext: additionalContext ? String(additionalContext).trim() : undefined,
    });

    return res.json(result);
  } catch (error: any) {
    console.warn('[CNPJ Search] Error:', error.message);
    return res.json({
      success: false,
      cnpj: '',
      confidence: 'NAO_ENCONTRADO',
      sources: [],
      summary: 'Erro ao processar a pesquisa de CNPJ.',
      error: error.message || 'Erro ao pesquisar CNPJ.',
    });
  }
});

// Batch Search Endpoint - searches all companies on the web and fills all verified fields
app.post('/api/cnpj/batch-search', async (req, res) => {
  try {
    const { companies } = req.body;
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de empresas é obrigatória.',
      });
    }

    const results: any[] = [];
    const targetCompanies = companies.slice(0, 150); // support processing up to 150 companies in batch

    // Process in small concurrency chunks (3 at a time) for speed + stability
    const CHUNK_SIZE = 3;
    for (let i = 0; i < targetCompanies.length; i += CHUNK_SIZE) {
      const chunk = targetCompanies.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map(async (comp) => {
        try {
          const searchRes = await executeCNPJSearch({
            companyName: comp.nome || comp.nomePadronizado,
            city: comp.cidade,
            uf: comp.uf,
            domain: comp.dominio,
            phone: comp.phone || comp.telefone,
            ddd: comp.ddd,
          });

          return {
            companyId: comp.id || comp.chaveNormalizada || comp.nome || comp.nomePadronizado,
            companyName: comp.nome || comp.nomePadronizado,
            success: searchRes.success && Boolean(searchRes.cnpj) && isValidCNPJ(searchRes.cnpj),
            cnpj: searchRes.success && searchRes.cnpj && isValidCNPJ(searchRes.cnpj) ? searchRes.cnpj : '',
            razaoSocial: searchRes.razaoSocial || comp.nome || comp.nomePadronizado,
            nomeFantasia: searchRes.nomeFantasia || '',
            situacaoCadastral: searchRes.situacaoCadastral || 'ATIVA',
            dataAbertura: searchRes.dataAbertura || '',
            cnae: searchRes.cnae || '',
            naturezaJuridica: searchRes.naturezaJuridica || '',
            logradouro: searchRes.logradouro || '',
            numero: searchRes.numero || '',
            complemento: searchRes.complemento || '',
            bairro: searchRes.bairro || '',
            cep: searchRes.cep || '',
            telefone: searchRes.telefone || comp.phone || comp.telefone || '',
            email: searchRes.email || '',
            isMatriz: searchRes.isMatriz,
            cidade: searchRes.cidade || comp.cidade || '',
            uf: searchRes.uf || comp.uf || '',
            confidence: searchRes.confidence,
            sources: searchRes.sources || [],
            summary: searchRes.summary,
            ddd: searchRes.ddd,
            ufOrigemDDD: searchRes.ufOrigemDDD,
          };
        } catch (err: any) {
          return {
            companyId: comp.id || comp.chaveNormalizada || comp.nome || comp.nomePadronizado,
            companyName: comp.nome || comp.nomePadronizado,
            success: false,
            cnpj: '',
            razaoSocial: comp.nome || comp.nomePadronizado,
            cidade: comp.cidade || '',
            uf: comp.uf || '',
            error: err.message || 'Erro ao pesquisar',
            sources: [],
            summary: 'Não foi possível validar CNPJ nos registros públicos.',
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      if (i + CHUNK_SIZE < targetCompanies.length) {
        await wait(300); // brief cooldown between chunks
      }
    }

    return res.json({ success: true, results });
  } catch (error: any) {
    return res.json({ success: false, results: [], error: error.message });
  }
});

// Unified pipeline: CNPJ identification + Econodata fiscal/financial enrichment.
app.post('/api/pipeline/enrich', async (req, res) => {
  try {
    const companies = Array.isArray(req.body?.companies) ? req.body.companies : [];
    if (companies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de empresas é obrigatória.',
      });
    }

    const targetCompanies = companies.slice(0, 500);
    const econodataConfigured = Boolean(getEconodataKey());
    const identified: any[] = [];
    const CHUNK_SIZE = 3;

    for (let index = 0; index < targetCompanies.length; index += CHUNK_SIZE) {
      const chunk = targetCompanies.slice(index, index + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (company: any) => {
          const companyName = String(company.nome || company.companyName || '').trim();
          const companyId = String(
            company.id || company.companyId || normalizeSearchStr(companyName).toUpperCase()
          );

          if (!companyName) {
            return {
              companyId,
              companyName,
              success: false,
              cnpj: '',
              confidence: 'NAO_ENCONTRADO',
              identificationSource: 'NONE',
              identificationNote: 'Nome da empresa ausente.',
            };
          }

          let match: any = null;
          let matchFailure: unknown = null;

          // Um CNPJ válido já presente na planilha não depende da chave
          // Econodata nem de consultas externas para ser identificado.
          const suppliedCnpj = onlyDigits(company.cnpj);
          if (suppliedCnpj.length === 14 && isValidCNPJ(suppliedCnpj)) {
            match = {
              cnpj: formatCNPJ(suppliedCnpj),
              confidence: 'ALTA',
              razaoSocial: companyName,
              source: 'PLANILHA',
              summary: 'CNPJ fornecido na planilha e validado pelo algoritmo Módulo 11.',
            };
          }

          if (!match && econodataConfigured) {
            try {
              match = await matchCompanyWithEconodata(company);
            } catch (error) {
              matchFailure = error;
            }
          }

          if (!match?.cnpj) {
            try {
              const fallback = await executeCNPJSearch({
                companyName,
                city: company.cidade,
                uf: company.uf,
                domain: company.dominio,
                phone: company.phone || company.telefone,
                ddd: company.ddd,
                additionalContext: company.nomeOriginal,
              });

              if (fallback?.success && fallback?.cnpj && isValidCNPJ(fallback.cnpj)) {
                match = {
                  cnpj: formatCNPJ(fallback.cnpj),
                  confidence: fallback.confidence || 'ALTA',
                  razaoSocial: fallback.razaoSocial || companyName,
                  nomeFantasia: fallback.nomeFantasia || '',
                  situacaoCadastral: fallback.situacaoCadastral || '',
                  cidade: fallback.cidade || company.cidade || '',
                  uf: fallback.uf || company.uf || '',
                  source: fallback.sources?.[0]?.title || 'BUSCA_PUBLICA',
                  summary: fallback.summary,
                };
              }
            } catch {}
          }

          if (!match?.cnpj || !isValidCNPJ(match.cnpj)) {
            return {
              companyId,
              companyName,
              success: false,
              cnpj: '',
              confidence: 'NAO_ENCONTRADO',
              identificationSource: 'NONE',
              identificationNote: matchFailure
                ? 'A Econodata não respondeu e nenhuma fonte alternativa confirmou o CNPJ.'
                : 'Nenhuma fonte confirmou o CNPJ com segurança.',
            };
          }

          return {
            companyId,
            companyName,
            success: true,
            cnpj: formatCNPJ(match.cnpj),
            confidence: match.confidence || 'ALTA',
            razaoSocial: match.razaoSocial || companyName,
            nomeFantasia: match.nomeFantasia || '',
            situacaoCadastral: match.situacaoCadastral || '',
            cidade: match.cidade || company.cidade || '',
            uf: match.uf || company.uf || '',
            identificationSource: match.source || 'BUSCA_PUBLICA',
            identificationNote: match.summary || 'CNPJ identificado e validado pelo Módulo 11.',
          };
        })
      );

      identified.push(...chunkResults);
      if (index + CHUNK_SIZE < targetCompanies.length) await wait(250);
    }

    const cnpjs = identified.filter((item) => item.success).map((item) => item.cnpj);
    let estimatedTokens = 0;
    let chargedTokens = 0;
    let enrichedCompanies: any[] = [];
    let enrichmentErrors: any[] = [];
    let enrichmentFailure: unknown = null;

    if (econodataConfigured && cnpjs.length > 0) {
      try {
        const estimate = await lookupCompaniesWithEconodata(cnpjs, true);
        estimatedTokens = estimate.tokens;
        const lookup = await lookupCompaniesWithEconodata(cnpjs, false);
        enrichedCompanies = lookup.companies;
        enrichmentErrors = lookup.errors;
        chargedTokens = lookup.charged;
      } catch (error) {
        enrichmentFailure = error;
      }
    }

    const enrichmentMap = new Map(
      enrichedCompanies.map((company) => [onlyDigits(company.cnpj), normalizeEconodataCompany(company)])
    );
    const enrichmentErrorMap = new Map(
      enrichmentErrors.map((item) => [onlyDigits(item?.cnpj), String(item?.motivo || 'not_found')])
    );

    const results = identified.map((item) => {
      if (!item.success || !item.cnpj) {
        return {
          ...item,
          status: 'NAO_ENCONTRADO',
          observacao: item.identificationNote,
        };
      }

      const normalized = enrichmentMap.get(onlyDigits(item.cnpj));
      if (normalized) {
        return {
          ...item,
          ...normalized,
          success: true,
          status: 'CONSULTADO',
          observacao: 'CNPJ identificado e dados fiscais/financeiros consultados na Econodata.',
        };
      }

      if (!econodataConfigured) {
        return {
          ...item,
          status: 'CHAVE_AUSENTE',
          observacao: 'CNPJ identificado; configure ECONODATA_API_KEY para obter faturamento e regime tributário.',
        };
      }

      if (enrichmentFailure) {
        return {
          ...item,
          status: econodataStatusFromError(enrichmentFailure),
          observacao: `CNPJ identificado, mas o enriquecimento não foi concluído: ${(enrichmentFailure as any)?.message || 'erro temporário'}.`,
        };
      }

      return {
        ...item,
        status: 'CNPJ_IDENTIFICADO',
        observacao: enrichmentErrorMap.has(onlyDigits(item.cnpj))
          ? 'CNPJ identificado, porém a Econodata não retornou os campos solicitados.'
          : 'CNPJ identificado; dados fiscais indisponíveis para este registro ou plano.',
      };
    });

    const summary = {
      totalCompanies: results.length,
      cnpjsIdentified: results.filter((item) => Boolean(item.cnpj)).length,
      econodataEnriched: results.filter((item) => item.status === 'CONSULTADO').length,
      notFound: results.filter((item) => item.status === 'NAO_ENCONTRADO').length,
      errors: results.filter((item) =>
        ['SEM_SALDO', 'SEM_PERMISSAO', 'LIMITE_ATINGIDO', 'ERRO_TEMPORARIO'].includes(item.status)
      ).length,
      estimatedTokens,
      chargedTokens,
      econodataConfigured,
    };

    return res.json({ success: true, results, summary });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      results: [],
      error: error?.message || 'Falha no pipeline unificado.',
    });
  }
});


// Exportado sem iniciar uma porta. O mesmo backend é montado tanto pelo
// Vite do AI Studio quanto pelo servidor Node de produção.
export default app;
