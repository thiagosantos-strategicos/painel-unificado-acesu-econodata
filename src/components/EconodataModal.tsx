import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal,
  RefreshCw,
  Lock,
  Server,
  Info
} from 'lucide-react';
import { EconodataStatus } from '../types';

interface EconodataModalProps {
  status: EconodataStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface AdminVerifyResult {
  status: string;
  timestamp: string;
  nodeEnv: string;
  server: {
    uptimeSeconds: number;
    nodeVersion: string;
  };
  econodata: {
    loaded: boolean;
    envVarDetected: string | null;
    keyLength: number;
    hasBearerPrefix: boolean;
    maskedPreview: string | null;
    validFormat: boolean;
    message: string;
  };
  gemini: {
    loaded: boolean;
  };
}

export const EconodataModal: React.FC<EconodataModalProps> = ({
  status,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [isAdminSectionOpen, setIsAdminSectionOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<AdminVerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyConfiguration = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/admin/verify-config');
      if (!res.ok) {
        throw new Error(`Erro HTTP ${res.status}: ${res.statusText}`);
      }
      const data: AdminVerifyResult = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyError(err?.message || 'Falha ao executar ping no endpoint de verificação do servidor.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleAdmin = () => {
    const nextState = !isAdminSectionOpen;
    setIsAdminSectionOpen(nextState);
    if (nextState && !verifyResult) {
      handleVerifyConfiguration();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#D5DFDC] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#162927] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#C89439] flex items-center justify-center text-[#162927]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base uppercase font-display tracking-wider">
                Integração API v4 Econodata
              </h3>
              <p className="text-xs text-[#9EB2AF]">Status de Conexão e Informações de Chave</p>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1" title="Fechar modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-[#2C3F3D] overflow-y-auto flex-1">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              status?.configured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {status?.configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}

            <div>
              <div className="font-bold text-sm">
                {status?.configured ? 'Econodata Conectada com Sucesso' : 'Chave ECONODATA_API_KEY Não Configurada'}
              </div>
              <p className="mt-1 text-xs leading-relaxed">
                {status?.configured
                  ? `A API v4 da Econodata está autenticada no servidor backend. Saldo disponível: ${status.balance ?? 'Ilimitado / Ativo'}.`
                  : 'Para enriquecimento automático com faturamento fiscal e regime tributário via Econodata, adicione a chave no menu de configurações do AI Studio.'}
              </p>
            </div>
          </div>

          {/* Configuration Guide */}
          <div className="bg-[#FAFBFB] p-4 rounded-xl border border-[#E3EBE9] space-y-2">
            <div className="font-bold text-[#162927] flex items-center space-x-1.5 text-xs uppercase tracking-wide">
              <Key className="w-4 h-4 text-[#C89439]" />
              <span>Como configurar as chaves no AI Studio</span>
            </div>
            <p className="text-xs text-[#526F6B]">
              No menu superior do Google AI Studio, acesse <strong className="text-[#162927]">Settings → Secrets</strong> e configure:
            </p>
            <div className="bg-[#162927] text-[#86E3CE] font-mono text-[11px] p-2.5 rounded-lg space-y-1">
              <div>ECONODATA_API_KEY=ek_live_...</div>
              <div>GEMINI_API_KEY=...</div>
            </div>
          </div>

          {/* Architecture info */}
          <div className="space-y-1.5 text-[11px] text-[#55736E]">
            <div className="flex items-center space-x-1 font-semibold text-[#162927]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Segurança e Auditoria do Pipeline:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>As chaves nunca são enviadas ao navegador (100% server-side).</li>
              <li>Deduplicação automática: empresas repetidas gastam apenas 1 token por lote.</li>
              <li>Fallback resiliente: caso a Econodata esteja sem saldo, a busca cadastral pública Módulo 11 segue ativa.</li>
            </ul>
          </div>

          {/* Admin-Only Verification Section */}
          {isAdminSectionOpen && (
            <div 
              id="admin-verify-card"
              className="mt-3 p-3.5 bg-[#122220] rounded-xl border border-[#2B4743] text-white space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-[#25423E] pb-2">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-[#86E3CE]" />
                  <span className="font-bold text-xs uppercase tracking-wide text-[#86E3CE]">
                    Diagnóstico do Servidor (Admin Ping)
                  </span>
                </div>
                <button
                  id="admin-reping-btn"
                  onClick={handleVerifyConfiguration}
                  disabled={isVerifying}
                  className="flex items-center space-x-1 text-[11px] bg-[#1E3B37] hover:bg-[#2A524D] text-[#86E3CE] px-2 py-1 rounded transition-colors disabled:opacity-50"
                  title="Executar novo ping no servidor"
                >
                  <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Verificando...' : 'Re-testar Ping'}</span>
                </button>
              </div>

              {verifyError && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-[11px] flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Falha na rota de verificação:</div>
                    <div>{verifyError}</div>
                  </div>
                </div>
              )}

              {verifyResult && (
                <div className="space-y-2 text-[11px]">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between bg-[#19322E] p-2 rounded-lg border border-[#254540]">
                    <span className="text-[#9EB2AF]">ECONODATA_API_KEY no process.env:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      verifyResult.econodata.loaded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {verifyResult.econodata.loaded ? '✓ Carregada no Servidor' : '✗ Não Detectada'}
                    </span>
                  </div>

                  {/* Detailed Specs */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-[#19322E] p-2 rounded border border-[#254540]">
                      <div className="text-[#9EB2AF]">Variável Detectada</div>
                      <div className="font-mono text-white mt-0.5 truncate">
                        {verifyResult.econodata.envVarDetected || 'Nenhuma'}
                      </div>
                    </div>
                    <div className="bg-[#19322E] p-2 rounded border border-[#254540]">
                      <div className="text-[#9EB2AF]">Tamanho do Token</div>
                      <div className="font-mono text-white mt-0.5">
                        {verifyResult.econodata.keyLength > 0 
                          ? `${verifyResult.econodata.keyLength} caracteres` 
                          : '0 caracteres'}
                      </div>
                    </div>
                  </div>

                  {/* Masked Preview & Format Check */}
                  {verifyResult.econodata.loaded && (
                    <div className="bg-[#19322E] p-2 rounded border border-[#254540] space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#9EB2AF]">Amostra Mascarada (Segura):</span>
                        <span className="font-mono text-[#86E3CE] font-bold">
                          {verifyResult.econodata.maskedPreview || '***'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#9EB2AF]">Prefixo Bearer Tratado:</span>
                        <span className="text-white">
                          {verifyResult.econodata.hasBearerPrefix ? 'Sim (Normalizado)' : 'Direto'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Server Telemetry */}
                  <div className="text-[9px] text-[#7A9894] flex items-center justify-between pt-1 border-t border-[#25423E]">
                    <span>Node: {verifyResult.server.nodeVersion} ({verifyResult.nodeEnv})</span>
                    <span>Ping: {new Date(verifyResult.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div className="text-[10px] text-[#86E3CE]/80 flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-[#86E3CE]" />
                    <span>Chave 100% protegida: nenhum caractere secreto exposto ao frontend.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAFBFB] border-t border-[#E3EBE9] flex items-center justify-between shrink-0">
          {/* Hidden Admin-Only Verify Trigger */}
          <button
            id="admin-verify-toggle-btn"
            onClick={handleToggleAdmin}
            className={`flex items-center space-x-1 text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${
              isAdminSectionOpen
                ? 'bg-[#162927] text-[#86E3CE] border-[#2C4A46]'
                : 'text-[#65827E] hover:text-[#162927] hover:bg-[#EAEFEB] border-transparent'
            }`}
            title="Diagnóstico avançado de carregamento de variáveis de ambiente no servidor"
          >
            <Server className="w-3.5 h-3.5 text-[#C89439]" />
            <span className="font-medium">
              {isAdminSectionOpen ? 'Ocultar Diagnóstico' : 'Verificar Configuração (Admin)'}
            </span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              id="econodata-refresh-modal-btn"
              onClick={onRefresh}
              className="px-3.5 py-1.5 bg-[#E2EBE9] hover:bg-[#D5E1DE] text-[#1F3D39] rounded-lg text-xs font-semibold border border-[#BDCEC9] transition-colors"
            >
              Testar Conexão Novamente
            </button>
            <button
              id="econodata-close-modal-btn"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#162927] hover:bg-[#254C48] text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
