import React, { useState } from 'react';
import { X, Save, Building2, User, Phone, Briefcase, MapPin } from 'lucide-react';
import { ParticipantRecord, HierarchicalLevel, FunctionalSector } from '../types';
import { formatCNPJ, isValidCNPJ, onlyDigits, isMatriz } from '../utils/cleaners';

interface EditParticipantModalProps {
  participant: ParticipantRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ParticipantRecord) => void;
}

export const EditParticipantModal: React.FC<EditParticipantModalProps> = ({
  participant,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !participant) return null;

  const [formData, setFormData] = useState<ParticipantRecord>({ ...participant });
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  const handleCnpjChange = (val: string) => {
    const digits = onlyDigits(val);
    const formatted = formatCNPJ(digits);
    if (digits.length === 14 && !isValidCNPJ(digits)) {
      setCnpjError('CNPJ inválido pelo Módulo 11 da Receita Federal.');
    } else {
      setCnpjError(null);
    }
    setFormData((prev) => ({
      ...prev,
      cnpj: formatted,
      isMatriz: digits.length === 14 ? isMatriz(digits) : prev.isMatriz,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cnpj && !isValidCNPJ(formData.cnpj)) {
      setCnpjError('Por favor informe um CNPJ válido de 14 dígitos.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#D5DFDC] overflow-hidden">
        {/* Header */}
        <div className="bg-[#162927] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#C89439] flex items-center justify-center text-[#162927]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base uppercase font-display tracking-wider">
                Editar Cadastro de Participante
              </h3>
              <p className="text-xs text-[#9EB2AF]">{participant.id}</p>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Nome & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">Nome Completo</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
              />
            </div>
          </div>

          {/* Telefone & Cargo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">Telefone / DDD</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">Cargo Declarado</label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
                required
              />
            </div>
          </div>

          {/* Nível Hierárquico & Setor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">Nível Hierárquico</label>
              <select
                value={formData.nivelHierarquico}
                onChange={(e) =>
                  setFormData({ ...formData, nivelHierarquico: e.target.value as HierarchicalLevel })
                }
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927] bg-white"
              >
                <option value="C-Level / Presidência">C-Level / Presidência</option>
                <option value="Diretoria">Diretoria</option>
                <option value="Gerência">Gerência</option>
                <option value="Coordenação / Supervisão">Coordenação / Supervisão</option>
                <option value="Especialista / Consultor">Especialista / Consultor</option>
                <option value="Analista">Analista</option>
                <option value="Operacional / Assistente">Operacional / Assistente</option>
                <option value="Outro / Não Definido">Outro / Não Definido</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">Setor Funcional</label>
              <select
                value={formData.setorFuncional}
                onChange={(e) =>
                  setFormData({ ...formData, setorFuncional: e.target.value as FunctionalSector })
                }
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927] bg-white"
              >
                <option value="Prevenção de Perdas & Riscos">Prevenção de Perdas & Riscos</option>
                <option value="Segurança Patrimonial & Cibernética">Segurança Patrimonial & Cibernética</option>
                <option value="Auditoria & Compliance">Auditoria & Compliance</option>
                <option value="Operações & Logística">Operações & Logística</option>
                <option value="Tecnologia & Inovação">Tecnologia & Inovação</option>
                <option value="Comercial & Vendas">Comercial & Vendas</option>
                <option value="Financeiro & Administrativo">Financeiro & Administrativo</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Geral / Executivo">Geral / Executivo</option>
              </select>
            </div>
          </div>

          {/* Empresa & CNPJ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">Empresa Padronizada</label>
              <input
                type="text"
                value={formData.empresaNormalizada}
                onChange={(e) => setFormData({ ...formData, empresaNormalizada: e.target.value })}
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">CNPJ (14 dígitos)</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full font-mono px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
              />
              {cnpjError && <p className="text-[10px] text-red-600 mt-0.5">{cnpjError}</p>}
            </div>
          </div>

          {/* Cidade e UF */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">Cidade</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#162927] mb-1">UF (Estado)</label>
              <input
                type="text"
                value={formData.uf}
                maxLength={2}
                onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 border border-[#CDD8D5] rounded-lg focus:ring-2 focus:ring-[#3A605B] text-[#162927] uppercase"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-[#EDF2F0] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#E2EBE9] hover:bg-[#D5E1DE] text-[#1F3D39] rounded-lg text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#162927] hover:bg-[#254C48] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-[#86E3CE]" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
