import React, { useRef, useState } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ParticipantRecord } from '../types';
import { 
  cleanName, 
  cleanString, 
  extractDDD, 
  formatPhone, 
  getUFInfoFromDDD, 
  normalizeCompanyName, 
  onlyDigits, 
  isValidCNPJ, 
  formatCNPJ, 
  isMatriz 
} from '../utils/cleaners';
import { classifyHierarchicalLevel, classifyFunctionalSector } from '../utils/jobClassification';
import { findKnownCompany } from '../utils/brazilianCompanies';

interface FileUploadProps {
  onDataLoaded: (records: ParticipantRecord[], filename: string) => void;
  onClose?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processRawRows = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) {
      setErrorMsg('O arquivo está vazio ou não possui linhas válidas.');
      setIsProcessing(false);
      return;
    }

    const processed: ParticipantRecord[] = [];

    rows.forEach((row, index) => {
      // Find matching keys regardless of casing / accents
      const keys = Object.keys(row);
      const findKey = (possibleNames: string[]) => {
        return keys.find((k) =>
          possibleNames.some((name) =>
            k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() ===
            name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          )
        );
      };

      const nameKey = findKey(['nome', 'nome completo', 'participante', 'contato', 'name', 'full name']);
      const emailKey = findKey(['email', 'e-mail', 'correio eletronico', 'mail']);
      const phoneKey = findKey(['telefone', 'celular', 'whatsapp', 'fone', 'tel', 'phone', 'mobile']);
      const cargoKey = findKey(['cargo', 'funcao', 'posicao', 'job', 'title', 'role', 'ocupacao']);
      const empresaKey = findKey(['empresa', 'organizacao', 'razao social', 'supermercado', 'company', 'organization']);
      const cidadeKey = findKey(['cidade', 'municipio', 'city']);
      const ufKey = findKey(['uf', 'estado', 'state']);
      const cnpjKey = findKey(['cnpj', 'cpf/cnpj', 'documento']);

      const rawName = nameKey ? cleanString(row[nameKey]) : '';
      const rawEmail = emailKey ? cleanString(row[emailKey]).toLowerCase() : '';
      const rawPhone = phoneKey ? cleanString(row[phoneKey]) : '';
      const rawCargo = cargoKey ? cleanString(row[cargoKey]) : '';
      const rawEmpresa = empresaKey ? cleanString(row[empresaKey]) : '';
      const rawCidade = cidadeKey ? cleanString(row[cidadeKey]) : '';
      const rawUf = ufKey ? cleanString(row[ufKey]).toUpperCase() : '';
      const rawCnpj = cnpjKey ? cleanString(row[cnpjKey]) : '';

      // Skip entirely empty row
      if (!rawName && !rawEmail && !rawEmpresa && !rawCargo) {
        return;
      }

      const ddd = extractDDD(rawPhone);
      const dddInfo = ddd ? getUFInfoFromDDD(ddd) : null;
      const uf = rawUf || (dddInfo ? dddInfo.uf : '');
      const cidade = rawCidade || (dddInfo && !dddInfo.capitalOuRegiao.includes('/') ? dddInfo.capitalOuRegiao : '');

      const nivelHierarquico = classifyHierarchicalLevel(rawCargo);
      const setorFuncional = classifyFunctionalSector(rawCargo);

      const empresaPadronizada = normalizeCompanyName(rawEmpresa) || rawEmpresa || 'Empresa Não Informada';

      // Check if known corporate verified network
      const known = findKnownCompany(rawEmpresa || empresaPadronizada);

      // Check provided CNPJ
      const digitsCnpj = onlyDigits(rawCnpj);
      const validCnpj = digitsCnpj.length === 14 && isValidCNPJ(digitsCnpj) ? formatCNPJ(digitsCnpj) : '';

      const cnpjFinal = validCnpj || (known ? known.cnpjMatriz : '');
      const isMatrizVal = cnpjFinal ? isMatriz(cnpjFinal) : false;

      processed.push({
        id: `PART-${String(index + 1).padStart(4, '0')}`,
        nome: cleanName(rawName) || `Participante ${index + 1}`,
        email: rawEmail,
        telefone: formatPhone(rawPhone),
        ddd: ddd || undefined,
        ufOrigemDDD: dddInfo?.uf,
        cargo: rawCargo || 'Não Informado',
        cargoNormalizado: cleanString(rawCargo),
        nivelHierarquico,
        setorFuncional,
        empresa: rawEmpresa || 'Empresa Não Informada',
        empresaNormalizada: empresaPadronizada,
        cidade: cidade || (known ? known.cidade : ''),
        uf: uf || (known ? known.uf : ''),
        cnpj: cnpjFinal,
        isMatriz: isMatrizVal,
        razaoSocial: known ? known.razaoSocial : undefined,
        nomeFantasia: known ? known.nomeFantasia : undefined,
        situacaoCadastral: known ? known.situacaoCadastral : validCnpj ? 'ATIVA' : undefined,
        cnae: known ? known.cnae : undefined,
        naturezaJuridica: known ? known.naturezaJuridica : undefined,
        statusEnriquecimento: known ? 'CONSULTADO' : validCnpj ? 'CNPJ_IDENTIFICADO' : 'NAO_ENCONTRADO',
        origemIdentificacao: known
          ? 'Base Cadastral Corporativa Oficial'
          : validCnpj
          ? 'Planilha de Entrada'
          : undefined,
        observacoes: known
          ? 'CNPJ Matriz identificado automaticamente.'
          : validCnpj
          ? 'CNPJ fornecido na planilha.'
          : 'Pendente de busca cadastral.',
        dataHoraConfirmacao: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    });

    if (processed.length === 0) {
      setErrorMsg('Não foi possível identificar colunas compatíveis no arquivo.');
      setIsProcessing(false);
      return;
    }

    onDataLoaded(processed, filename);
    setIsProcessing(false);
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          processRawRows(json, file.name);
        } catch (err: any) {
          setErrorMsg(`Erro ao ler arquivo Excel: ${err.message}`);
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Falha ao carregar o arquivo selecionado.');
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'csv' || ext === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawRows(results.data, file.name);
        },
        error: (err) => {
          setErrorMsg(`Erro ao ler CSV: ${err.message}`);
          setIsProcessing(false);
        },
      });
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const rows = Array.isArray(json) ? json : json.participantes || json.data || [json];
          processRawRows(rows, file.name);
        } catch (err: any) {
          setErrorMsg(`Erro ao ler JSON: ${err.message}`);
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMsg('Formato não suportado. Utilize arquivos XLSX, XLS, CSV ou JSON.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#D5DFDC]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E7ECEB] flex items-center justify-center text-[#1F3D39]">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#162927] font-display uppercase tracking-wide">
              Carregar Planilha de Participantes
            </h3>
            <p className="text-xs text-[#526F6B]">
              Suporte a XLSX, XLS, CSV e JSON com auto-detecção de colunas e ETL inteligente
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#C89439] bg-[#FAF6EE]'
            : 'border-[#B8CAC7] hover:border-[#738F8B] bg-[#F7F9F9]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          accept=".xlsx,.xls,.csv,.json,.txt"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-[#D5DFDC] flex items-center justify-center text-[#3A605B]">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-[#C89439] border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileUp className="w-6 h-6" />
            )}
          </div>
          <div className="text-sm font-semibold text-[#162927]">
            {isProcessing
              ? 'Processando e higienizando dados...'
              : 'Arraste a planilha aqui ou clique para selecionar'}
          </div>
          <p className="text-xs text-[#68827E] max-w-md">
            Identifica automaticamente: <span className="font-semibold text-[#1F3D39]">Nome, Cargo, Empresa, E-mail, Telefone/DDD, Cidade e UF</span>.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
