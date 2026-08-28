export interface DDDInfo {
  ddd: string;
  uf: string;
  estado: string;
  regiao: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
  capitalOuRegiao: string;
}

export const BRAZILIAN_DDD_MAP: Record<string, DDDInfo> = {
  // São Paulo
  '11': { ddd: '11', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'São Paulo (Capital/Região Metropolitana)' },
  '12': { ddd: '12', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'São José dos Campos / Vale do Paraíba' },
  '13': { ddd: '13', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'Santos / Baixada Santista' },
  '14': { ddd: '14', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'Bauru / Marília / Botucatu' },
  '15': { ddd: '15', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'Sorocaba / Itapetininga' },
  '16': { ddd: '16', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'Ribeirão Preto / Franca' },
  '17': { ddd: '17', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'São José do Rio Preto / Barretos' },
  '18': { ddd: '18', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'Presidente Prudente / Araçatuba' },
  '19': { ddd: '19', uf: 'SP', estado: 'São Paulo', regiao: 'Sudeste', capitalOuRegiao: 'Campinas / Piracicaba' },

  // Rio de Janeiro
  '21': { ddd: '21', uf: 'RJ', estado: 'Rio de Janeiro', regiao: 'Sudeste', capitalOuRegiao: 'Rio de Janeiro (Capital/Metropolitana)' },
  '22': { ddd: '22', uf: 'RJ', estado: 'Rio de Janeiro', regiao: 'Sudeste', capitalOuRegiao: 'Campos dos Goytacazes / Cabo Frio' },
  '24': { ddd: '24', uf: 'RJ', estado: 'Rio de Janeiro', regiao: 'Sudeste', capitalOuRegiao: 'Volta Redonda / Petrópolis' },

  // Espírito Santo
  '27': { ddd: '27', uf: 'ES', estado: 'Espírito Santo', regiao: 'Sudeste', capitalOuRegiao: 'Vitória (Capital/Metropolitana)' },
  '28': { ddd: '28', uf: 'ES', estado: 'Espírito Santo', regiao: 'Sudeste', capitalOuRegiao: 'Cachoeiro de Itapemirim / Sul' },

  // Minas Gerais
  '31': { ddd: '31', uf: 'MG', estado: 'Minas Gerais', regiao: 'Sudeste', capitalOuRegiao: 'Belo Horizonte (Capital/Metropolitana)' },
  '32': { ddd: '32', uf: 'MG', estado: 'Minas Gerais', regiao: 'Sudeste', capitalOuRegiao: 'Juiz de Fora / Zona da Mata' },
  '33': { ddd: '33', uf: 'MG', estado: 'Minas Gerais', regiao: 'Sudeste', capitalOuRegiao: 'Governador Valadares / Teófilo Otoni' },
  '34': { ddd: '34', uf: 'MG', estado: 'Minas Gerais', regiao: 'Sudeste', capitalOuRegiao: 'Uberlândia / Triângulo Mineiro' },
  '35': { ddd: '35', uf: 'MG', estado: 'Minas Gerais', regiao: 'Sudeste', capitalOuRegiao: 'Poços de Caldas / Pouso Alegre / Sul' },
  '37': { ddd: '37', uf: 'MG', estado: 'Minas Gerais', regiao: 'Sudeste', capitalOuRegiao: 'Divinópolis / Centro-Oeste' },
  '38': { ddd: '38', uf: 'MG', estado: 'Minas Gerais', regiao: 'Sudeste', capitalOuRegiao: 'Montes Claros / Norte de Minas' },

  // Paraná
  '41': { ddd: '41', uf: 'PR', estado: 'Paraná', regiao: 'Sul', capitalOuRegiao: 'Curitiba (Capital/Metropolitana)' },
  '42': { ddd: '42', uf: 'PR', estado: 'Paraná', regiao: 'Sul', capitalOuRegiao: 'Ponta Grossa / Guarapuava' },
  '43': { ddd: '43', uf: 'PR', estado: 'Paraná', regiao: 'Sul', capitalOuRegiao: 'Londrina / Apucarana' },
  '44': { ddd: '44', uf: 'PR', estado: 'Paraná', regiao: 'Sul', capitalOuRegiao: 'Maringá / Campo Mourão' },
  '45': { ddd: '45', uf: 'PR', estado: 'Paraná', regiao: 'Sul', capitalOuRegiao: 'Foz do Iguaçu / Cascavel' },
  '46': { ddd: '46', uf: 'PR', estado: 'Paraná', regiao: 'Sul', capitalOuRegiao: 'Francisco Beltrão / Pato Branco' },

  // Santa Catarina
  '47': { ddd: '47', uf: 'SC', estado: 'Santa Catarina', regiao: 'Sul', capitalOuRegiao: 'Joinville / Blumenau / Itajaí' },
  '48': { ddd: '48', uf: 'SC', estado: 'Santa Catarina', regiao: 'Sul', capitalOuRegiao: 'Florianópolis / Criciúma' },
  '49': { ddd: '49', uf: 'SC', estado: 'Santa Catarina', regiao: 'Sul', capitalOuRegiao: 'Chapecó / Oeste' },

  // Rio Grande do Sul
  '51': { ddd: '51', uf: 'RS', estado: 'Rio Grande do Sul', regiao: 'Sul', capitalOuRegiao: 'Porto Alegre (Capital/Metropolitana)' },
  '53': { ddd: '53', uf: 'RS', estado: 'Rio Grande do Sul', regiao: 'Sul', capitalOuRegiao: 'Pelotas / Rio Grande' },
  '54': { ddd: '54', uf: 'RS', estado: 'Rio Grande do Sul', regiao: 'Sul', capitalOuRegiao: 'Caxias do Sul / Serra Gaúcha' },
  '55': { ddd: '55', uf: 'RS', estado: 'Rio Grande do Sul', regiao: 'Sul', capitalOuRegiao: 'Santa Maria / Uruguaiana' },

  // Centro-Oeste
  '61': { ddd: '61', uf: 'DF', estado: 'Distrito Federal', regiao: 'Centro-Oeste', capitalOuRegiao: 'Brasília' },
  '62': { ddd: '62', uf: 'GO', estado: 'Goiás', regiao: 'Centro-Oeste', capitalOuRegiao: 'Goiânia / Anápolis' },
  '64': { ddd: '64', uf: 'GO', estado: 'Goiás', regiao: 'Centro-Oeste', capitalOuRegiao: 'Rio Verde / Caldas Novas' },
  '65': { ddd: '65', uf: 'MT', estado: 'Mato Grosso', regiao: 'Centro-Oeste', capitalOuRegiao: 'Cuiabá (Capital/Metropolitana)' },
  '66': { ddd: '66', uf: 'MT', estado: 'Mato Grosso', regiao: 'Centro-Oeste', capitalOuRegiao: 'Rondonópolis / Sinop' },
  '67': { ddd: '67', uf: 'MS', estado: 'Mato Grosso do Sul', regiao: 'Centro-Oeste', capitalOuRegiao: 'Campo Grande / Dourados' },
  '68': { ddd: '68', uf: 'AC', estado: 'Acre', regiao: 'Norte', capitalOuRegiao: 'Rio Branco' },
  '69': { ddd: '69', uf: 'RO', estado: 'Rondônia', regiao: 'Norte', capitalOuRegiao: 'Porto Velho / Ji-Paraná' },

  // Nordeste / Bahia
  '71': { ddd: '71', uf: 'BA', estado: 'Bahia', regiao: 'Nordeste', capitalOuRegiao: 'Salvador (Capital/Metropolitana)' },
  '73': { ddd: '73', uf: 'BA', estado: 'Bahia', regiao: 'Nordeste', capitalOuRegiao: 'Ilhéus / Itabuna / Porto Seguro' },
  '74': { ddd: '74', uf: 'BA', estado: 'Bahia', regiao: 'Nordeste', capitalOuRegiao: 'Juazeiro / Jacobina' },
  '75': { ddd: '75', uf: 'BA', estado: 'Bahia', regiao: 'Nordeste', capitalOuRegiao: 'Feira de Santana / Alagoinhas' },
  '77': { ddd: '77', uf: 'BA', estado: 'Bahia', regiao: 'Nordeste', capitalOuRegiao: 'Vitória da Conquista / Barreiras' },
  '79': { ddd: '79', uf: 'SE', estado: 'Sergipe', regiao: 'Nordeste', capitalOuRegiao: 'Aracaju' },

  // Nordeste
  '81': { ddd: '81', uf: 'PE', estado: 'Pernambuco', regiao: 'Nordeste', capitalOuRegiao: 'Recife (Capital/Metropolitana)' },
  '82': { ddd: '82', uf: 'AL', estado: 'Alagoas', regiao: 'Nordeste', capitalOuRegiao: 'Maceió' },
  '83': { ddd: '83', uf: 'PB', estado: 'Paraíba', regiao: 'Nordeste', capitalOuRegiao: 'João Pessoa / Campina Grande' },
  '84': { ddd: '84', uf: 'RN', estado: 'Rio Grande do Norte', regiao: 'Nordeste', capitalOuRegiao: 'Natal / Mossoró' },
  '85': { ddd: '85', uf: 'CE', estado: 'Ceará', regiao: 'Nordeste', capitalOuRegiao: 'Fortaleza (Capital/Metropolitana)' },
  '86': { ddd: '86', uf: 'PI', estado: 'Piauí', regiao: 'Nordeste', capitalOuRegiao: 'Teresina / Parnaíba' },
  '87': { ddd: '87', uf: 'PE', estado: 'Pernambuco', regiao: 'Nordeste', capitalOuRegiao: 'Petrolina / Garanhuns / Sertão' },
  '88': { ddd: '88', uf: 'CE', estado: 'Ceará', regiao: 'Nordeste', capitalOuRegiao: 'Juazeiro do Norte / Sobral' },
  '89': { ddd: '89', uf: 'PI', estado: 'Piauí', regiao: 'Nordeste', capitalOuRegiao: 'Picos / Floriano' },

  // Norte / Maranhão / Pará
  '91': { ddd: '91', uf: 'PA', estado: 'Pará', regiao: 'Norte', capitalOuRegiao: 'Belém (Capital/Metropolitana)' },
  '92': { ddd: '92', uf: 'AM', estado: 'Amazonas', regiao: 'Norte', capitalOuRegiao: 'Manaus (Capital/Metropolitana)' },
  '93': { ddd: '93', uf: 'PA', estado: 'Pará', regiao: 'Norte', capitalOuRegiao: 'Santarém / Altamira' },
  '94': { ddd: '94', uf: 'PA', estado: 'Pará', regiao: 'Norte', capitalOuRegiao: 'Marabá / Parauapebas' },
  '95': { ddd: '95', uf: 'RR', estado: 'Roraima', regiao: 'Norte', capitalOuRegiao: 'Boa Vista' },
  '96': { ddd: '96', uf: 'AP', estado: 'Amapá', regiao: 'Norte', capitalOuRegiao: 'Macapá' },
  '97': { ddd: '97', uf: 'AM', estado: 'Amazonas', regiao: 'Norte', capitalOuRegiao: 'Coari / Interior do Amazonas' },
  '98': { ddd: '98', uf: 'MA', estado: 'Maranhão', regiao: 'Nordeste', capitalOuRegiao: 'São Luís' },
  '99': { ddd: '99', uf: 'MA', estado: 'Maranhão', regiao: 'Nordeste', capitalOuRegiao: 'Imperatriz / Caxias' },
};

export function onlyDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\D/g, '');
}

export function extractDDD(phone: string | number | null | undefined): string | null {
  if (!phone) return null;
  const str = String(phone).trim();
  
  // Format: (11) 98765-4321
  const parenMatch = str.match(/\(([1-9][0-9])\)/);
  if (parenMatch && BRAZILIAN_DDD_MAP[parenMatch[1]]) {
    return parenMatch[1];
  }

  // Format: 5511987654321 or +55 11 ...
  const digits = onlyDigits(str);
  if (digits.startsWith('55') && digits.length >= 12) {
    const candidate = digits.substring(2, 4);
    if (BRAZILIAN_DDD_MAP[candidate]) return candidate;
  }

  // 10 or 11 digits: 11987654321 or 3133334444
  if (digits.length === 10 || digits.length === 11) {
    const candidate = digits.substring(0, 2);
    if (BRAZILIAN_DDD_MAP[candidate]) return candidate;
  }

  // Look for any standard 2-digit DDD at the start of phone string
  const leadingDddMatch = str.match(/^\+?([1-9][0-9])[\s-]/);
  if (leadingDddMatch && BRAZILIAN_DDD_MAP[leadingDddMatch[1]]) {
    return leadingDddMatch[1];
  }

  return null;
}

export function getUFInfoFromDDD(ddd: string | null | undefined): DDDInfo | null {
  if (!ddd) return null;
  return BRAZILIAN_DDD_MAP[ddd] || null;
}

export function getUFFromPhone(phone: string | number | null | undefined): string | null {
  const ddd = extractDDD(phone);
  if (!ddd) return null;
  const info = getUFInfoFromDDD(ddd);
  return info ? info.uf : null;
}

export function formatPhone(phone: string | number | null | undefined): string {
  const digits = onlyDigits(phone);
  if (!digits) return String(phone || '').trim();

  let cleanDigits = digits;
  if (cleanDigits.startsWith('55') && cleanDigits.length >= 12) {
    cleanDigits = cleanDigits.substring(2);
  }

  if (cleanDigits.length === 11) {
    return cleanDigits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (cleanDigits.length === 10) {
    return cleanDigits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  if (cleanDigits.length === 9) {
    return cleanDigits.replace(/^(\d{5})(\d{4})$/, '$1-$2');
  }
  if (cleanDigits.length === 8) {
    return cleanDigits.replace(/^(\d{4})(\d{4})$/, '$1-$2');
  }
  return String(phone || '').trim();
}

export function isValidCNPJ(cnpj: string | number | null | undefined): boolean {
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

export function formatCNPJ(cnpj: string | number | null | undefined): string {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return digits ? String(cnpj) : '';
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function isMatriz(cnpj: string | null | undefined): boolean {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return false;
  return digits.substring(8, 12) === '0001';
}

export function cleanName(name: string | null | undefined): string {
  if (!name) return '';
  return String(name)
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      if (['de', 'da', 'do', 'das', 'dos', 'e'].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function normalizeCompanyName(name: string | null | undefined): string {
  if (!name) return '';
  let str = String(name).trim();

  // Remove common corporate suffixes for clean matching
  str = str
    .replace(/\s+(ltda|s\.a\.?|sa|eireli|me|epp|s\/a|comercio|supermercados?|mercados?|grupo)\b/gi, '')
    .trim();

  return str
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      if (['de', 'da', 'do', 'das', 'dos', 'e', '&'].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}
