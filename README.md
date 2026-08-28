# Painel Unificado ACESU + Econodata

Aplicação full-stack que reúne em um único projeto:

- upload de XLSX, XLS, CSV e JSON;
- limpeza, padronização e deduplicação da base;
- classificação de cargos por nível hierárquico e setor funcional;
- identificação de CNPJ por nome da empresa, telefone, DDD e UF;
- validação de CNPJ pelo algoritmo Módulo 11 e fontes cadastrais públicas;
- match e enriquecimento fiscal/financeiro pela API v4 da Econodata;
- cards com CNPJ, faturamento, regime tributário e porte;
- dashboard, auditoria e exportações em CSV/XLSX;
- aba e arquivo independente `EMPRESAS_ENRIQUECIDAS`;
- aba e arquivo compacto `EMPRESA_CNPJ`, mantendo a saída do consolidador original.

## Configuração no Google AI Studio

No painel **Settings → Secrets**, configure:

```text
ECONODATA_API_KEY=ek_live_...
GEMINI_API_KEY=...
```

`ECONODATA_API_KEY` é usada exclusivamente no servidor. `GEMINI_API_KEY` é opcional para o fallback de pesquisa de CNPJ com Google Search Grounding.

Nunca coloque as chaves em arquivos do frontend, `localStorage` ou parâmetros de URL.

## Execução local

```bash
npm install
npm run dev
```

O servidor inicia em `http://localhost:3000` e entrega o frontend Vite e as rotas internas.

## Build de produção

```bash
npm run lint
npm run build
npm start
```

## Pipeline

1. A planilha é lida no navegador.
2. Os dados são higienizados e classificados.
3. Empresas são deduplicadas antes de qualquer consulta externa.
4. O backend identifica CNPJs usando Econodata Match e fallbacks auditáveis.
5. CNPJs confirmados são enviados em lotes de até 100 para a Econodata.
6. O backend solicita somente cadastro, regime e faturamento.
7. Os dados retornam ao painel e são propagados para todos os participantes da mesma empresa.
8. O app gera o consolidado, a aba enriquecida, o arquivo independente e o CSV dos cards.

## Rotas internas

- `GET /api/health`
- `GET /api/econodata/status`
- `GET /api/cnpj/lookup/:cnpj`
- `POST /api/cnpj/search-web`
- `POST /api/cnpj/batch-search`
- `POST /api/pipeline/enrich`

## Segurança e consumo

- A chave Econodata permanece no backend.
- O frontend envia somente empresa, telefone/DDD, cidade/UF e CNPJ existente.
- Empresas repetidas são consultadas apenas uma vez por processamento.
- O backend estima tokens antes do lookup pago e retorna tokens estimados e consumidos.
- Falhas individuais não interrompem o tratamento da planilha.

## Compatibilidade com a prévia do Google AI Studio

O backend Express é montado de duas maneiras:

- como middleware do Vite, quando o AI Studio inicia somente a prévia do frontend;
- pelo `start.ts`, quando o aplicativo é executado como servidor Node completo.

Isso impede que chamadas para `/api/*` sejam desviadas para o `index.html`. Se a
prévia estiver sem backend, o frontend mostra uma mensagem de diagnóstico em vez
do erro genérico `Unexpected token '<'`.
