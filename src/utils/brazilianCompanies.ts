export interface KnownCompany {
  chave: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjMatriz: string;
  cidade: string;
  uf: string;
  cnae: string;
  naturezaJuridica: string;
  dominio?: string;
  situacaoCadastral: string;
  aliases: string[];
}

export const KNOWN_BRAZILIAN_COMPANIES: KnownCompany[] = [
  {
    chave: 'SUPERMERCADOS_BH',
    razaoSocial: 'SUPERMERCADOS BH COMERCIO DE ALIMENTOS S.A.',
    nomeFantasia: 'SUPERMERCADOS BH',
    cnpjMatriz: '04.641.376/0001-36',
    cidade: 'Santa Luzia',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '205-4 - Sociedade Anônima Fechada',
    dominio: 'supermercadosbh.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['supermercados bh', 'supermercado bh', 'bh supermercados', 'supermercados bh s/a', 'bh atacado e varejo', 'supermercado bh s a'],
  },
  {
    chave: 'MART_MINAS',
    razaoSocial: 'MART MINAS DISTRIBUICAO LTDA',
    nomeFantasia: 'MART MINAS ATACADO E VAREJO',
    cnpjMatriz: '04.407.497/0001-44',
    cidade: 'Contagem',
    uf: 'MG',
    cnae: '4711-3/01 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - hipermercados',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'martminas.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['mart minas', 'martminas', 'mart minas atacado', 'mart minas atacarejo', 'mart minas distribuicao'],
  },
  {
    chave: 'DMA_DISTRIBUIDORA_EPA',
    razaoSocial: 'DMA DISTRIBUIDORA S/A',
    nomeFantasia: 'EPA SUPERMERCADOS / MINEIRAO ATACAREJO',
    cnpjMatriz: '21.050.413/0001-90',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '205-4 - Sociedade Anônima Fechada',
    dominio: 'dmaonline.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['epa', 'epa supermercados', 'mineirao atacarejo', 'mineirao', 'dma distribuidora', 'dma', 'dma distribuidora sa', 'grupo dma'],
  },
  {
    chave: 'GRUPO_SUPER_NOSSO',
    razaoSocial: 'SUPER NOSSO COMERCIO LTDA',
    nomeFantasia: 'SUPER NOSSO / APOIO MINEIRO',
    cnpjMatriz: '02.434.908/0001-40',
    cidade: 'Contagem',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'supernosso.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['super nosso', 'supernosso', 'apoio mineiro', 'grupo super nosso', 'dec minas', 'super nosso gourmet'],
  },
  {
    chave: 'SUPERMERCADOS_VERDEMAR',
    razaoSocial: 'VERDEMAR ALIMENTOS LTDA',
    nomeFantasia: 'SUPERMERCADO VERDEMAR',
    cnpjMatriz: '00.417.857/0001-81',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'verdemar.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['verdemar', 'supermercado verdemar', 'supermercados verdemar', 'verdemar supermercado'],
  },
  {
    chave: 'GRUPO_BAHAMAS',
    razaoSocial: 'BAHAMAS DISTRIBUIDORA DE ALIMENTOS S.A.',
    nomeFantasia: 'SUPERMERCADOS BAHAMAS / BAHAMAS MIX',
    cnpjMatriz: '21.579.528/0001-09',
    cidade: 'Juiz de Fora',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '205-4 - Sociedade Anônima Fechada',
    dominio: 'bahamas.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['bahamas', 'supermercados bahamas', 'bahamas mix', 'grupo bahamas', 'bahamas atacarejo'],
  },
  {
    chave: 'ATACADAO',
    razaoSocial: 'ATACADAO S.A.',
    nomeFantasia: 'ATACADAO',
    cnpjMatriz: '75.315.333/0001-09',
    cidade: 'São Paulo',
    uf: 'SP',
    cnae: '4691-5/00 - Comércio atacadista de mercadorias em geral com predominância de produtos alimentícios',
    naturezaJuridica: '204-6 - Sociedade Anônima Aberta',
    dominio: 'atacadao.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['atacadao', 'atacadao sa', 'atacadao s/a', 'atacadao s.a.', 'atacadao atacarejo'],
  },
  {
    chave: 'ASSAI_ATACADISTA',
    razaoSocial: 'SENDAS DISTRIBUIDORA S/A',
    nomeFantasia: 'ASSAI ATACADISTA',
    cnpjMatriz: '06.057.223/0001-71',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    cnae: '4711-3/01 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - hipermercados',
    naturezaJuridica: '204-6 - Sociedade Anônima Aberta',
    dominio: 'assai.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['assai', 'assai atacadista', 'sendas distribuidora', 'assai atacarejo', 'sendas'],
  },
  {
    chave: 'CARREFOUR_BRASIL',
    razaoSocial: 'CARREFOUR COMERCIO E INDUSTRIA LTDA',
    nomeFantasia: 'CARREFOUR HIPERMERCADO / GRUPO CARREFOUR',
    cnpjMatriz: '45.543.915/0001-81',
    cidade: 'São Paulo',
    uf: 'SP',
    cnae: '4711-3/01 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - hipermercados',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'carrefour.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['carrefour', 'grupo carrefour', 'carrefour brasil', 'carrefour express', 'carrefour market'],
  },
  {
    chave: 'GRUPO_PÃO_DE_AÇÚCAR',
    razaoSocial: 'COMPANHIA BRASILEIRA DE DISTRIBUICAO',
    nomeFantasia: 'GPA / PAO DE ACUCAR / EXTRA',
    cnpjMatriz: '47.508.411/0001-56',
    cidade: 'São Paulo',
    uf: 'SP',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '204-6 - Sociedade Anônima Aberta',
    dominio: 'gpabr.com',
    situacaoCadastral: 'ATIVA',
    aliases: ['gpa', 'pao de acucar', 'pão de açúcar', 'extra supermercados', 'grupo pao de acucar', 'compre bem', 'minuto pao de acucar'],
  },
  {
    chave: 'SUPERMERCADOS_ALVORADA',
    razaoSocial: 'SUPERMERCADO ALVORADA LTDA',
    nomeFantasia: 'SUPERMERCADOS ALVORADA',
    cnpjMatriz: '19.467.579/0001-44',
    cidade: 'Pouso Alegre',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'supermercadosalvorada.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['alvorada', 'supermercados alvorada', 'supermercado alvorada'],
  },
  {
    chave: 'SUPERMERCADOS_ABC',
    razaoSocial: 'ABC COMERCIO E DISTRIBUICAO LTDA',
    nomeFantasia: 'SUPERMERCADOS ABC',
    cnpjMatriz: '20.590.237/0001-08',
    cidade: 'Divinópolis',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'superabc.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['abc', 'supermercados abc', 'supermercado abc', 'grupo abc', 'abc atacado e varejo', 'super abc'],
  },
  {
    chave: 'SUPERMERCADOS_BRETAS',
    razaoSocial: 'CENCOSUD BRASIL COMERCIAL LTDA',
    nomeFantasia: 'BRETAS / CENCOSUD',
    cnpjMatriz: '08.905.647/0001-00',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral com predominância de produtos alimentícios - supermercados',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'bretas.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['bretas', 'supermercados bretas', 'bretas supermercados', 'cencosud', 'cencosud brasil'],
  },
  {
    chave: 'SUPERMERCADO_LIPPI',
    razaoSocial: 'SUPERMERCADO LIPPI LTDA',
    nomeFantasia: 'SUPERMERCADO LIPPI',
    cnpjMatriz: '21.579.528/0001-09',
    cidade: 'São João del Rei',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    situacaoCadastral: 'ATIVA',
    aliases: ['lippi', 'supermercado lippi', 'supermercados lippi'],
  },
  {
    chave: 'SUPERMERCADOS_MINEIRAO',
    razaoSocial: 'MINEIRAO ATACAREJO COMERCIO DE ALIMENTOS S.A.',
    nomeFantasia: 'MINEIRAO ATACAREJO',
    cnpjMatriz: '21.050.413/0001-90',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cnae: '4711-3/02 - Comércio varejista de mercadorias em geral',
    naturezaJuridica: '205-4 - Sociedade Anônima Fechada',
    dominio: 'mineiraoatacarejo.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['mineirao atacarejo', 'mineirão atacarejo', 'atacarejo mineirao'],
  },
  {
    chave: 'ACESU_ASSOCIACAO',
    razaoSocial: 'ASSOCIACAO CENTRAL DOS SUPERMERCADOS - ACESU',
    nomeFantasia: 'ACESU',
    cnpjMatriz: '25.684.743/0001-30',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cnae: '9430-8/00 - Atividades de associações de defesa de direitos sociais',
    naturezaJuridica: '399-9 - Associação Privada',
    dominio: 'acesu.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['acesu', 'associacao acesu', 'forum acesu', 'associação central dos supermercados'],
  },
  {
    chave: 'STRATEGICOS_CONSULTORIA',
    razaoSocial: 'STRATEGICOS CONSULTORIA EM GESTAO EMPRESARIAL LTDA',
    nomeFantasia: 'STRATEGICOS GROUP',
    cnpjMatriz: '35.819.421/0001-50',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cnae: '7020-4/00 - Atividades de consultoria em gestão empresarial',
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    dominio: 'strategicos.com.br',
    situacaoCadastral: 'ATIVA',
    aliases: ['strategicos', 'strategicos group', 'strategicos consultoria'],
  }
];

function normalizeSimple(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findKnownCompany(companyName: string | null | undefined): KnownCompany | null {
  if (!companyName) return null;
  const target = normalizeSimple(companyName);
  if (!target) return null;

  for (const company of KNOWN_BRAZILIAN_COMPANIES) {
    const normRazao = normalizeSimple(company.razaoSocial);
    const normFantasia = normalizeSimple(company.nomeFantasia);

    if (target === normRazao || target === normFantasia) {
      return company;
    }

    for (const alias of company.aliases) {
      const normAlias = normalizeSimple(alias);
      if (target === normAlias || target.includes(normAlias) || normAlias.includes(target)) {
        return company;
      }
    }
  }

  return null;
}
