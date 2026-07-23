import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Tag,
  Calendar,
  Clock,
  ShieldCheck,
  Percent,
  Award,
  History,
  UserCheck,
  FileText,
  X,
  Sparkles,
  ChevronRight,
  Download,
  RefreshCw,
  ScanLine,
  Check,
  CreditCard,
  Phone,
  Mail,
  ExternalLink,
  Plus
} from "lucide-react";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";

interface PartnerPortalProps {
  isOpen: boolean;
  onClose: () => void;
  db: any;
  currentUser: any;
  members?: any[];
  partners?: any[];
  showNotification: (type: "success" | "error" | "info", message: string) => void;
}

export const PartnerPortalModal: React.FC<PartnerPortalProps> = ({
  isOpen,
  onClose,
  db,
  currentUser,
  members = [],
  partners = [],
  showNotification,
}) => {
  const [activeTab, setActiveTab] = useState<"validator" | "discounts" | "history">("validator");
  
  // QR Code / Lookup state
  const [lookupQuery, setLookupQuery] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  
  // Discount redemption state
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [discountPercentApplied, setDiscountPercentApplied] = useState("15");
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [isSavingRedemption, setIsSavingRedemption] = useState(false);

  // Discounts search state
  const [discountSearch, setDiscountSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // History state
  const [redemptionLogs, setRedemptionLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Scanner mode simulation
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === "history") {
      fetchRedemptionHistory();
    }
  }, [isOpen, activeTab]);

  const fetchRedemptionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, "partner_redemptions"),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRedemptionLogs(list);
    } catch (err) {
      console.warn("Could not fetch redemption history from Firestore", err);
      // Fallback local memory
      try {
        const stored = localStorage.getItem("sinpa_partner_redemptions");
        if (stored) {
          setRedemptionLogs(JSON.parse(stored));
        }
      } catch (e) {}
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleValidateAssociate = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const queryTerm = (customCode || lookupQuery).trim();
    if (!queryTerm) {
      showNotification("error", "Por favor, informe o QR Code, CPF/CNPJ ou Nome do Associado.");
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Clean query digits for CNPJ/CPF matching
      const cleanDigits = queryTerm.replace(/\D/g, "");

      // 1. Search in Firestore members collection
      let matchedMember: any = null;

      try {
        const snap = await getDocs(collection(db, "members"));
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          matchedMember = list.find((m: any) => {
            const mCnpj = (m.cnpj || "").replace(/\D/g, "");
            const mName = (m.name || "").toLowerCase();
            const qLower = queryTerm.toLowerCase();
            const mId = (m.id || "").toLowerCase();

            return (
              (cleanDigits && mCnpj && mCnpj.includes(cleanDigits)) ||
              mName.includes(qLower) ||
              mId.includes(qLower) ||
              qLower.includes(mId)
            );
          });
        }
      } catch (err) {
        console.warn("Firestore members query error, checking local list", err);
      }

      // 2. Fallback to passed members prop if not found in Firestore
      if (!matchedMember && members.length > 0) {
        matchedMember = members.find((m) => {
          const mCnpj = (m.cnpj || "").replace(/\D/g, "");
          const mName = (m.name || "").toLowerCase();
          const qLower = queryTerm.toLowerCase();

          return (
            (cleanDigits && mCnpj && mCnpj.includes(cleanDigits)) ||
            mName.includes(qLower)
          );
        });
      }

      // 3. Fallback mock for demonstration if query matches sample patterns
      if (!matchedMember && (queryTerm.toLowerCase().includes("metalurgica") || queryTerm.includes("12345") || queryTerm.toLowerCase().includes("valido") || cleanDigits === "12345678000190")) {
        matchedMember = {
          id: "MBR-99812",
          name: "Indústria Metalúrgica Salvador S/A",
          cnpj: "12.345.678/0001-90",
          status: "active",
          level: "Ouro",
          representative: "Carlos Alberto Santos",
          email: "contato@metalurgicasalvador.com.br",
          validUntil: "31/12/2026",
        };
      }

      if (matchedMember) {
        const isActive =
          matchedMember.status === "active" ||
          matchedMember.status === "Ativo" ||
          matchedMember.status === "regular";

        const today = new Date();
        const validUntilDate = matchedMember.validUntil
          ? matchedMember.validUntil
          : "31/12/2026";

        setValidationResult({
          isValid: isActive,
          memberId: matchedMember.id || "MBR-ACTIVE",
          name: matchedMember.name || "Empresa Associada SINPA",
          cnpj: matchedMember.cnpj || "00.000.000/0001-00",
          level: matchedMember.level || "Bronze",
          representative: matchedMember.representative || "Representante Cadastrado",
          status: isActive ? "Ativo & Regular" : "Inadimplente / Inativo",
          validUntil: validUntilDate,
          codeScanned: queryTerm,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          reason: isActive
            ? "Associado com mensalidades em dia e carteira digital dentro da validade."
            : "Cadastro suspenso ou com mensalidades pendentes. Favor orientar contato com a secretaria.",
        });

        if (isActive) {
          showNotification("success", "🟢 Associado Ativo! Desconto liberado.");
        } else {
          showNotification("error", "🔴 Associado Inativo ou Inadimplente!");
        }
      } else {
        setValidationResult({
          isValid: false,
          notFound: true,
          codeScanned: queryTerm,
          reason: "Nenhum associado localizado com o código ou CNPJ informado. Verifique a digitação.",
        });
        showNotification("error", "Código ou CNPJ não localizado no cadastro.");
      }
    } catch (err: any) {
      console.error("Erro na validação do associado:", err);
      showNotification("error", "Erro ao validar QR Code. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult || !validationResult.isValid) return;

    setIsSavingRedemption(true);
    try {
      const redemptionData = {
        memberId: validationResult.memberId,
        memberName: validationResult.name,
        cnpj: validationResult.cnpj,
        partnerEmail: currentUser?.email || "parceiro@sinpaba.com.br",
        purchaseAmount: purchaseAmount ? parseFloat(purchaseAmount) : 0,
        discountPercent: discountPercentApplied,
        notes: redemptionNotes || "Sem observações",
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString("pt-BR"),
        timeStr: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      // Save to Firestore
      try {
        await addDoc(collection(db, "partner_redemptions"), redemptionData);
      } catch (err) {
        console.warn("Could not write redemption to Firestore, saving locally", err);
      }

      // Save to local state and localStorage
      const updatedList = [redemptionData, ...redemptionLogs];
      setRedemptionLogs(updatedList);
      try {
        localStorage.setItem("sinpa_partner_redemptions", JSON.stringify(updatedList));
      } catch (e) {}

      showNotification("success", "Desconto registrado com sucesso no histórico!");
      setPurchaseAmount("");
      setRedemptionNotes("");
      setValidationResult(null);
      setLookupQuery("");
    } catch (err: any) {
      console.error("Erro ao registrar uso de desconto:", err);
      showNotification("error", "Erro ao registrar o desconto. " + err.message);
    } finally {
      setIsSavingRedemption(false);
    }
  };

  const samplePartnersList = [
    {
      id: "p1",
      name: "Unimed Regional",
      category: "saude",
      categoryLabel: "Saúde & Medicina",
      discount: "20%",
      rules: "Apresentar Carteira Digital SINPA ativa no ato da contratação ou renovação do plano corporativo.",
      description: "Plano de saúde empresarial com carência zero e ampla rede credenciada.",
      contact: "(75) 3281-1000",
      email: "convenios@unimedregional.com.br",
      status: "Ativo",
      validUntil: "31/12/2026",
    },
    {
      id: "p2",
      name: "Faculdade Impacto",
      category: "educacao",
      categoryLabel: "Educação & Cursos",
      discount: "35%",
      rules: "Válido para colaboradores diretos e dependentes de empresas associadas com carteira regular.",
      description: "Desconto especial em cursos de Graduação, Pós-Graduação e Mba Presencial e EAD.",
      contact: "(75) 3281-2200",
      email: "bolsas@impacto.edu.br",
      status: "Ativo",
      validUntil: "31/12/2026",
    },
    {
      id: "p3",
      name: "Hotel Vista Mar",
      category: "lazer",
      categoryLabel: "Lazer & Hotelaria",
      discount: "15%",
      rules: "Reserva antecipada informando o código SINPA e validação do QR Code no check-in.",
      description: "Tarifas corporativas diferenciadas para viagens de negócios e lazer familiar.",
      contact: "(75) 3281-5500",
      email: "reservas@hotelvistamar.com.br",
      status: "Ativo",
      validUntil: "31/12/2026",
    },
    {
      id: "p4",
      name: "Porto Seguro Corporativo",
      category: "servicos",
      categoryLabel: "Serviços & Seguros",
      discount: "10%",
      rules: "Aplica-se a seguros de frota, patrimonial e responsabilidade civil para empresas filiadas.",
      description: "Seguros empresariais com condições exclusivas e assistência 24h prioritária.",
      contact: "0800 727 0800",
      email: "sinpa@portoseguro.com.br",
      status: "Ativo",
      validUntil: "31/12/2026",
    },
    {
      id: "p5",
      name: "Senai Tecnologias",
      category: "educacao",
      categoryLabel: "Educação & Cursos",
      discount: "15%",
      rules: "Aplica-se a matrículas em treinamentos técnicos e certificações industriais.",
      description: "Capacitação técnica para equipes de manutenção, solda, automação e logística.",
      contact: "(75) 3281-9900",
      email: "cursos@senai.org.br",
      status: "Ativo",
      validUntil: "31/12/2026",
    },
  ];

  const allPartnersToDisplay = partners.length > 0 ? partners : samplePartnersList;

  const filteredDiscounts = allPartnersToDisplay.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) {
      return false;
    }
    if (discountSearch.trim()) {
      const term = discountSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        (p.discount && p.discount.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-blue-950/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-5xl rounded-[36px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] border border-gray-100"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 sm:p-8 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500/20 border border-amber-400/30 rounded-2xl flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    Portal do Parceiro Conveniado
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Sistema Verificado
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
                  Validação de Benefícios SINPA
                </h2>
                <p className="text-blue-200/80 text-xs sm:text-sm font-medium">
                  Consulte a adimplência dos associados e consulte convênios com descontos exclusivos.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Fechar Modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setActiveTab("validator")}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                activeTab === "validator"
                  ? "bg-amber-400 text-blue-950 shadow-lg font-black"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <ScanLine className="w-4 h-4" />
              Validador de QR Code
            </button>

            <button
              onClick={() => setActiveTab("discounts")}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                activeTab === "discounts"
                  ? "bg-amber-400 text-blue-950 shadow-lg font-black"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <Percent className="w-4 h-4" />
              Consulta de Descontos
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                activeTab === "history"
                  ? "bg-amber-400 text-blue-950 shadow-lg font-black"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <History className="w-4 h-4" />
              Histórico de Uso ({redemptionLogs.length})
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
          <AnimatePresence mode="wait">
            {/* TAB 1: VALIDATOR */}
            {activeTab === "validator" && (
              <motion.div
                key="tab-validator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search / Validation Box */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-blue-950 text-base flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-blue-600" />
                        Verificação de Elegibilidade do Associado
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Insira a chave do QR Code, CNPJ ou Nome da empresa para validar a carteira digital.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSimulatingScan(!isSimulatingScan);
                        if (!isSimulatingScan) {
                          setLookupQuery("MBR-99812");
                          handleValidateAssociate(undefined, "MBR-99812");
                        }
                      }}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      {isSimulatingScan ? "Limpar Leitor" : "Simular Leitura de Câmera (QR Teste)"}
                    </button>
                  </div>

                  <form onSubmit={handleValidateAssociate} className="space-y-4">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        placeholder="Ex: MBR-99812, 12.345.678/0001-90 ou Nome da Empresa..."
                        className="w-full bg-gray-50 border border-gray-200 focus:border-blue-900 focus:bg-white pl-12 pr-32 py-4 rounded-2xl font-bold text-sm text-gray-900 outline-none transition-all shadow-inner"
                      />
                      <QrCode className="w-6 h-6 text-gray-400 absolute left-4 pointer-events-none" />

                      <button
                        type="submit"
                        disabled={isValidating}
                        className="absolute right-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isValidating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Consultando...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" /> Validar
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Test Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Exemplos rápidos:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLookupQuery("12.345.678/0001-90");
                          handleValidateAssociate(undefined, "12.345.678/0001-90");
                        }}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Associado Válido
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLookupQuery("99.999.999/0001-99");
                          handleValidateAssociate(undefined, "99.999.999/0001-99");
                        }}
                        className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3 text-rose-600" /> Associado Inativo
                      </button>
                    </div>
                  </form>
                </div>

                {/* RESULT CARD DISPLAY */}
                <AnimatePresence>
                  {validationResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -10 }}
                      className={`rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden transition-all ${
                        validationResult.isValid
                          ? "bg-emerald-950/5 border-emerald-300 ring-2 ring-emerald-500/20"
                          : "bg-rose-950/5 border-rose-300 ring-2 ring-rose-500/20"
                      }`}
                    >
                      {validationResult.isValid ? (
                        <div className="space-y-6">
                          {/* Header Result Status */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-600 text-white p-5 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                <span className="bg-emerald-800 text-emerald-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                  STATUS CONFIRMADO
                                </span>
                                <h4 className="text-xl font-black font-display tracking-tight">
                                  🟢 ASSOCIADO ATIVO E REGULAR
                                </h4>
                                <p className="text-emerald-100 text-xs font-medium">
                                  Direito total a todos os benefícios e descontos de convênios.
                                </p>
                              </div>
                            </div>

                            <div className="bg-white/10 px-4 py-2 rounded-xl text-right shrink-0 border border-white/20">
                              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">
                                Validade da Carteira
                              </span>
                              <span className="text-sm font-black font-mono">
                                {validationResult.validUntil}
                              </span>
                            </div>
                          </div>

                          {/* Associate Info Grid */}
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                                Empresa / Razão Social
                              </span>
                              <p className="font-bold text-blue-950 text-base leading-snug">
                                {validationResult.name}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                                CNPJ
                              </span>
                              <p className="font-bold text-gray-800 text-sm font-mono">
                                {validationResult.cnpj}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                                Categoria do Filiado
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-xs rounded-full">
                                <Award className="w-3.5 h-3.5 text-amber-600" />
                                {validationResult.level}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                                Representante Legal
                              </span>
                              <p className="font-bold text-gray-700 text-xs">
                                {validationResult.representative}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                                Horário da Consulta
                              </span>
                              <p className="font-bold text-gray-700 text-xs font-mono">
                                {validationResult.timestamp}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                                Código Validado
                              </span>
                              <p className="font-bold text-blue-900 text-xs font-mono">
                                {validationResult.codeScanned}
                              </p>
                            </div>
                          </div>

                          {/* Form to Record Discount Redemption */}
                          <form onSubmit={handleConfirmRedemption} className="bg-emerald-50/50 border border-emerald-200 p-6 rounded-2xl space-y-4">
                            <h5 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                              <Tag className="w-4 h-4 text-emerald-600" />
                              Registrar Concessão de Desconto / Uso do Convênio
                            </h5>

                            <div className="grid sm:grid-cols-3 gap-4">
                              <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1">
                                  Valor da Compra / Serviço (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Ex: 250.00"
                                  value={purchaseAmount}
                                  onChange={(e) => setPurchaseAmount(e.target.value)}
                                  className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-xs text-gray-900 focus:border-emerald-600 outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1">
                                  % Desconto Aplicado
                                </label>
                                <select
                                  value={discountPercentApplied}
                                  onChange={(e) => setDiscountPercentApplied(e.target.value)}
                                  className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-xs text-gray-900 focus:border-emerald-600 outline-none cursor-pointer"
                                >
                                  <option value="10">10% Off</option>
                                  <option value="15">15% Off</option>
                                  <option value="20">20% Off</option>
                                  <option value="25">25% Off</option>
                                  <option value="30">30% Off</option>
                                  <option value="35">35% Off</option>
                                  <option value="50">50% Off</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1">
                                  Nº Cupom / Ordem de Serviço
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: OS-2026-401"
                                  value={redemptionNotes}
                                  onChange={(e) => setRedemptionNotes(e.target.value)}
                                  className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-xs text-gray-900 focus:border-emerald-600 outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isSavingRedemption}
                              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isSavingRedemption ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" /> Registrando...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" /> Confirmar Concessão do Desconto ao Associado
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      ) : (
                        /* Inactive / Not Found Result */
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 bg-rose-600 text-white p-5 rounded-2xl shadow-lg">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                              <XCircle className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <span className="bg-rose-800 text-rose-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                STATUS IRREGULAR OU NÃO LOCALIZADO
                              </span>
                              <h4 className="text-xl font-black font-display tracking-tight">
                                🔴 REGULARIZAÇÃO NECESSÁRIA / NÃO ELEGÍVEL
                              </h4>
                              <p className="text-rose-100 text-xs font-medium">
                                O desconto não pode ser concedido no momento.
                              </p>
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-2xl border border-rose-100 space-y-3">
                            <p className="text-gray-700 text-sm font-bold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                              {validationResult.reason}
                            </p>
                            <p className="text-xs text-gray-500">
                              Oriente o associado a acessar o Portal do Associado SINPA ou entrar em contato com a secretaria do sindicato pelo telefone (75) 3281-9988 para regularizar o cadastro.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* TAB 2: CONSULTA DE DESCONTOS E CONVÊNIOS */}
            {activeTab === "discounts" && (
              <motion.div
                key="tab-discounts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search & Category Filter */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-blue-950 text-base flex items-center gap-2">
                        <Percent className="w-5 h-5 text-amber-500" />
                        Catálogo de Convênios & Tabela de Descontos
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Consulte as regras e percentuais de desconto oferecidos aos associados ativos.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 text-blue-900 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <Award className="w-4 h-4 text-blue-600" />
                      {filteredDiscounts.length} Convênios Ativos
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={discountSearch}
                        onChange={(e) => setDiscountSearch(e.target.value)}
                        placeholder="Buscar por parceiro ou serviço..."
                        className="w-full bg-gray-50 border border-gray-200 focus:border-blue-900 focus:bg-white pl-10 pr-4 py-3 rounded-2xl text-xs font-bold text-gray-900 outline-none transition-all"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-blue-900 focus:bg-white px-4 py-3 rounded-2xl text-xs font-bold text-gray-900 outline-none transition-all cursor-pointer"
                    >
                      <option value="all">Todas as Categorias</option>
                      <option value="saude">Saúde & Medicina</option>
                      <option value="educacao">Educação & Cursos</option>
                      <option value="lazer">Lazer & Hotelaria</option>
                      <option value="servicos">Serviços & Seguros</option>
                    </select>
                  </div>
                </div>

                {/* Discounts Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredDiscounts.map((partner) => (
                    <div
                      key={partner.id}
                      className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all space-y-4 relative overflow-hidden group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
                            {partner.categoryLabel || partner.category || "Convênio"}
                          </span>
                          <h4 className="font-bold text-blue-950 text-lg group-hover:text-amber-600 transition-colors">
                            {partner.name}
                          </h4>
                        </div>

                        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-blue-950 font-black text-xl px-3.5 py-2 rounded-2xl shadow-md shrink-0 border border-amber-300">
                          {partner.discount} OFF
                        </div>
                      </div>

                      <p className="text-gray-600 text-xs leading-relaxed font-medium">
                        {partner.description}
                      </p>

                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-600" /> Regra de Concessão:
                        </span>
                        <p className="text-xs text-gray-700 font-semibold leading-snug">
                          {partner.rules || "Apresentar Carteira Digital SINPA ativa com QR Code regular no momento da contratação."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {partner.contact || "(75) 3281-9988"}
                        </span>
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Contrato Vigente ({partner.validUntil || "2026"})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 3: HISTÓRICO DE USO DE DESCONTOS */}
            {activeTab === "history" && (
              <motion.div
                key="tab-history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-blue-950 text-base flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-600" />
                        Histórico de Registros de Desconto
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Registros de atendimentos e concessões de desconto efetuadas para associados.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={fetchRedemptionHistory}
                      className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all cursor-pointer"
                      title="Atualizar histórico"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                  </div>

                  {redemptionLogs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 space-y-3">
                      <QrCode className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                        Nenhum registro de uso de desconto encontrado.
                      </p>
                      <p className="text-gray-400 text-xs max-w-sm mx-auto">
                        Utilize a aba "Validador de QR Code" para consultar um associado e registrar seu atendimento.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            <th className="py-3 px-4">Data / Hora</th>
                            <th className="py-3 px-4">Empresa Associada</th>
                            <th className="py-3 px-4">CNPJ</th>
                            <th className="py-3 px-4">Desconto</th>
                            <th className="py-3 px-4">Valor Total</th>
                            <th className="py-3 px-4">Observação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                          {redemptionLogs.map((log, index) => (
                            <tr key={log.id || index} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                                {log.dateStr || log.timestamp?.slice(0, 10)} {log.timeStr}
                              </td>
                              <td className="py-3.5 px-4 text-blue-950 font-bold">
                                {log.memberName}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-gray-600">
                                {log.cnpj}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-md text-[11px]">
                                  {log.discountPercent}% OFF
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-emerald-700">
                                {log.purchaseAmount
                                  ? `R$ ${Number(log.purchaseAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                  : "-"}
                              </td>
                              <td className="py-3.5 px-4 text-gray-500">
                                {log.notes || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-900" />
            <span>SINPA BA - Sindicato Patronal de Paulo Afonso e Região</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
