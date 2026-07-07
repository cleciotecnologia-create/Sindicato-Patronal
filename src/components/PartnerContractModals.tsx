import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Eye,
  Download,
  CheckCircle,
  Calendar,
  FileCheck,
} from "lucide-react";

interface PartnerContractModalsProps {
  showContractModal: boolean;
  setShowContractModal: (show: boolean) => void;
  showContractPreview: boolean;
  setShowContractPreview: (show: boolean) => void;
  selectedPartnerForContract: any;
  contractForm: any;
  setContractForm: (form: any) => void;
  selectedContractForView: any;
  setSelectedContractForView: (contract: any) => void;
  handleSaveContract: () => void;
  generatePartnerContractPDF: (contract: any) => void;
}

export const PartnerContractModals: React.FC<PartnerContractModalsProps> = ({
  showContractModal,
  setShowContractModal,
  showContractPreview,
  setShowContractPreview,
  selectedPartnerForContract,
  contractForm,
  setContractForm,
  selectedContractForView,
  setSelectedContractForView,
  handleSaveContract,
  generatePartnerContractPDF,
}) => {
  return (
    <>
      {/* Contract Generation Modal */}
      <AnimatePresence>
        {showContractModal && (
          <div key="partner-contract-generation-container" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContractModal(false)}
              className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[44px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-blue-900 font-display">
                      Gerador de Contrato de Parceria
                    </h3>
                    <p className="text-gray-500 font-medium text-sm">
                      Configure os termos, representantes e cláusulas do acordo com {selectedPartnerForContract?.name}.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Sindicato Info */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">1</span>
                      Dados do Sindicato (SINPA)
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Razão Social</label>
                      <input
                        type="text"
                        value={contractForm.sinpaName}
                        onChange={(e) => setContractForm({ ...contractForm, sinpaName: e.target.value })}
                        className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CNPJ do Sindicato</label>
                      <input
                        type="text"
                        value={contractForm.sinpaCnpj}
                        onChange={(e) => setContractForm({ ...contractForm, sinpaCnpj: e.target.value })}
                        className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Representante Legal</label>
                        <input
                          type="text"
                          value={contractForm.sinpaRepresentative}
                          onChange={(e) => setContractForm({ ...contractForm, sinpaRepresentative: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cargo do Rep.</label>
                        <input
                          type="text"
                          value={contractForm.sinpaRepresentativeRole}
                          onChange={(e) => setContractForm({ ...contractForm, sinpaRepresentativeRole: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Endereço do Sindicato</label>
                      <input
                        type="text"
                        value={contractForm.sinpaAddress}
                        onChange={(e) => setContractForm({ ...contractForm, sinpaAddress: e.target.value })}
                        className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                      />
                    </div>
                  </div>

                  {/* Right Column: Partner Info */}
                  <div className="bg-blue-50/20 p-6 rounded-3xl border border-blue-50/50 space-y-4">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">2</span>
                      Dados do Parceiro Conveniado
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Razão Social / Nome Fantasia</label>
                      <input
                        type="text"
                        value={contractForm.partnerName}
                        onChange={(e) => setContractForm({ ...contractForm, partnerName: e.target.value })}
                        className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CNPJ da Empresa</label>
                      <input
                        type="text"
                        value={contractForm.partnerCnpj}
                        onChange={(e) => setContractForm({ ...contractForm, partnerCnpj: e.target.value })}
                        className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        placeholder="Ex: 00.000.000/0001-00"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Representante do Parceiro</label>
                        <input
                          type="text"
                          value={contractForm.partnerRepresentative}
                          onChange={(e) => setContractForm({ ...contractForm, partnerRepresentative: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cargo / Função</label>
                        <input
                          type="text"
                          value={contractForm.partnerRepresentativeRole}
                          onChange={(e) => setContractForm({ ...contractForm, partnerRepresentativeRole: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                          placeholder="Ex: Diretor de Vendas"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Endereço da Empresa</label>
                      <input
                        type="text"
                        value={contractForm.partnerAddress}
                        onChange={(e) => setContractForm({ ...contractForm, partnerAddress: e.target.value })}
                        className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        placeholder="Endereço corporativo completo"
                      />
                    </div>
                  </div>

                  {/* Section 3: Terms and Conditions */}
                  <div className="col-span-1 lg:col-span-2 bg-gray-50/30 p-6 rounded-3xl border border-gray-100 space-y-4">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">3</span>
                      Condições Comerciais, Vigência e Cláusulas
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Desconto Concedido</label>
                        <input
                          type="text"
                          value={contractForm.discount}
                          onChange={(e) => setContractForm({ ...contractForm, discount: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Data de Início</label>
                        <input
                          type="date"
                          value={contractForm.startDate}
                          onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Data de Fim</label>
                        <input
                          type="date"
                          value={contractForm.endDate}
                          onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Foro de Eleição</label>
                        <input
                          type="text"
                          value={contractForm.forum}
                          onChange={(e) => setContractForm({ ...contractForm, forum: e.target.value })}
                          className="w-full bg-white border border-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Objeto do Convênio / Descrição Detalhada dos Benefícios</label>
                      <textarea
                        value={contractForm.description}
                        onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-900 h-24 resize-none"
                        placeholder="Especifique detalhadamente quais produtos, cursos, exames ou serviços estão elegíveis ao desconto, bem como as regras e restrições de uso."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end mt-10">
                  <button
                    onClick={() => {
                      setSelectedContractForView(contractForm);
                      setShowContractPreview(true);
                    }}
                    className="px-6 py-4 border border-gray-100 bg-white text-gray-500 rounded-2xl font-bold text-sm hover:text-blue-900 hover:border-blue-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Eye className="w-5 h-5" /> Live Preview Termo
                  </button>
                  <button
                    onClick={handleSaveContract}
                    className="px-8 py-4 bg-blue-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/10"
                  >
                    <CheckCircle className="w-5 h-5" /> Finalizar & Gerar Contrato
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contract Preview Modal (Interactive document mockup) */}
      <AnimatePresence>
        {showContractPreview && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContractPreview(false)}
              className="absolute inset-0 bg-blue-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-4xl rounded-[44px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-8 pb-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                    <FileCheck className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-950 font-display">
                      Visualização de Termo de Convênio
                    </h3>
                    <p className="text-xs text-gray-400 font-medium font-mono">
                      Ref: {selectedContractForView?.id || "PREVIEW"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContractPreview(false)}
                  className="w-12 h-12 bg-white border border-gray-100 flex items-center justify-center rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Document Body */}
              <div className="flex-1 overflow-y-auto p-12 bg-gray-100/40 custom-scrollbar flex justify-center">
                <div className="bg-white w-full max-w-2xl min-h-[297mm] p-12 shadow-md border border-gray-100 rounded-3xl text-gray-800 font-sans leading-relaxed text-sm">
                  {/* Internal document layout */}
                  <div className="text-center border-b-2 border-double border-gray-300 pb-6 mb-8">
                    <h1 className="text-lg font-black text-blue-950 tracking-wider uppercase">
                      INSTRUMENTO PARTICULAR DE ACORDO DE PARCERIA
                    </h1>
                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                      CONVÊNIO DE BENEFÍCIOS E VANTAGENS COMERCIAIS
                    </p>
                  </div>

                  <div className="space-y-6 text-justify text-xs text-gray-700">
                    <p>
                      Pelo presente instrumento particular de parceria comercial, de um lado:
                    </p>

                    <p className="pl-4 border-l-2 border-blue-200">
                      <strong>PARTE PRIMEIRA (SINDICATO):</strong> <span className="uppercase font-bold text-blue-900">{selectedContractForView?.sinpaName || "SINPA"}</span>, inscrito no CNPJ sob o nº {selectedContractForView?.sinpaCnpj || "N/A"}, com endereço corporativo situado em {selectedContractForView?.sinpaAddress || "N/A"}, neste ato representado legalmente por {selectedContractForView?.sinpaRepresentative || "N/A"}, na qualidade de {selectedContractForView?.sinpaRepresentativeRole || "N/A"}.
                    </p>

                    <p>
                      E, de outro lado, na qualidade de conveniado:
                    </p>

                    <p className="pl-4 border-l-2 border-emerald-200">
                      <strong>PARTE SEGUNDA (PARCEIRO CONVENIADO):</strong> <span className="uppercase font-bold text-blue-950">{selectedContractForView?.partnerName || "EMPRESA PARCEIRA"}</span>, inscrito no CNPJ sob o nº {selectedContractForView?.partnerCnpj || "N/A"}, com sede comercial em {selectedContractForView?.partnerAddress || "N/A"}, neste ato devidamente representado por {selectedContractForView?.partnerRepresentative || "N/A"}, na qualidade de {selectedContractForView?.partnerRepresentativeRole || "N/A"}.
                    </p>

                    <p>
                      Resolvem de comum acordo estabelecer a presente parceria de cooperação mútua comercial e institucional, mediante as cláusulas e condições que se seguem:
                    </p>

                    <p>
                      <strong>CLÁUSULA PRIMEIRA – DO OBJETO:</strong> O presente convênio tem por objeto a concessão de descontos e vantagens especiais aos associados adimplentes, parceiros institucionais e funcionários da primeira contratante, consistindo no desconto garantido de <strong className="text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded">{selectedContractForView?.discount || "N/A"} OFF</strong> incidente sobre a tabela de preços oficial do parceiro.
                    </p>

                    <p>
                      <strong>PARÁGRAFO ÚNICO:</strong> Os referidos benefícios aplicam-se à seguinte especificação de produtos e/ou serviços: <em>"{selectedContractForView?.description || "Todos os serviços corporativos oferecidos pela conveniada."}"</em>.
                    </p>

                    <p>
                      <strong>CLÁUSULA SEGUNDA – DA FORMA DE IDENTIFICAÇÃO:</strong> Para fruição do benefício de desconto assegurado neste termo, o beneficiário deverá comprovar seu vínculo ativo com o Sindicato mediante apresentação de carteira de associado (digital ou física) ou comprovante recente emitido pelo portal.
                    </p>

                    <p>
                      <strong>CLÁUSULA TERCEIRA – DA VIGÊNCIA E RESCISÃO:</strong> Este acordo de cooperação comercial terá vigência estabelecida pelo prazo de {selectedContractForView?.startDate ? selectedContractForView.startDate.split("-").reverse().join("/") : "N/A"} a {selectedContractForView?.endDate ? selectedContractForView.endDate.split("-").reverse().join("/") : "N/A"}. O convênio poderá ser rescindido voluntariamente por qualquer das partes mediante envio de comunicação formal por escrito com antecedência mínima de 30 (trinta) dias.
                    </p>

                    <p>
                      <strong>CLÁUSULA QUARTA – DO FORO DE ELEIÇÃO:</strong> Fica eleito de forma exclusiva o foro da Comarca de {selectedContractForView?.forum || "Salvador - BA"} para dirimir quaisquer controvérsias ou eventuais litígios que porventura decorram da execução e interpretação do presente instrumento.
                    </p>

                    <p className="mt-8 text-center text-gray-500 italic">
                      Salvador - BA, {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}.
                    </p>

                    {/* Signature mockup */}
                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-dashed border-gray-200 mt-12 text-center text-[11px]">
                      <div>
                        <div className="border-t border-gray-300 w-48 mx-auto pt-2">
                          <p className="font-bold text-gray-700">{selectedContractForView?.sinpaRepresentative || "Representante"}</p>
                          <p className="text-gray-400 text-[10px]">{selectedContractForView?.sinpaRepresentativeRole || "Representante SINPA"}</p>
                          <p className="text-[10px] text-blue-900 font-bold tracking-tighter mt-1">SINDICATO PARCEIRO</p>
                        </div>
                      </div>
                      <div>
                        <div className="border-t border-gray-300 w-48 mx-auto pt-2">
                          <p className="font-bold text-gray-700">{selectedContractForView?.partnerRepresentative || "Representante"}</p>
                          <p className="text-gray-400 text-[10px]">{selectedContractForView?.partnerRepresentativeRole || "Diretor/Sócio"}</p>
                          <p className="text-[10px] text-emerald-700 font-bold tracking-tighter mt-1">EMPRESA PARCEIRA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-8 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/30">
                <div className="text-xs text-gray-400 font-medium">
                  Documento em conformidade com o regimento interno do Clube de Benefícios.
                </div>
                <button
                  onClick={() => generatePartnerContractPDF(selectedContractForView)}
                  className="px-6 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-900/10"
                >
                  <Download className="w-5 h-5" /> Baixar Documento em PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
