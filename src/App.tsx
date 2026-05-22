import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  Clock, 
  LayoutDashboard,
  ShieldCheck,
  Send,
  Mail,
  Phone,
  BarChart3,
  Bell,
  Info,
  AlertCircle,
  ExternalLink,
  Search,
  Printer,
  ShieldAlert,
  FileCheck,
  MessageCircle,
  MessageSquare,
  Calculator,
  Gift,
  Briefcase,
  Zap,
  Bot,
  Sparkles,
  ImageIcon,
  Palette,
  Save,
  Camera,
  Upload,
  MapPin,
  Building,
  Banknote,
  Hash,
  DownloadCloud,
  CheckCircle,
  X,
  Plus,
  Menu,
  Minus,
  PieChart,
  Vote,
  Fingerprint,
  UserCheck,
  TrendingUp,
  Globe,
  Settings,
  LogOut,
  Check,
  Home,
  HelpCircle,
  Link,
  ArrowDownCircle,
  PiggyBank,
  QrCode,
  LayoutGrid,
  List,
  ArrowLeft,
  Calendar,
  Eye,
  Loader2,
  Pencil,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { QRCodeCanvas } from 'qrcode.react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { auth, db, handleFirestoreError, OperationType, firebaseConfig } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection,
  collectionGroup,
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  serverTimestamp,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'publication' | 'payment' | 'announcement';
  title: string;
  description: string;
  date: string;
  read: boolean;
}

interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
}

const queryClient = new QueryClient();

interface CertificateRequest {
  id: string;
  type: 'quitacao' | 'regularidade' | 'outros';
  status: 'pending' | 'processing' | 'available' | 'rejected';
  date: string;
  companyName: string;
  cnpj: string;
  observations?: string;
  documentUrl?: string;
}

interface Partner {
  id: string;
  name: string;
  category: 'saude' | 'educacao' | 'lazer' | 'servicos' | 'comercio';
  discount: string;
  description: string;
  logo: string;
  website?: string;
  featured?: boolean;
  expiresAt?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'presidencia' | 'diretoria' | 'gerencia' | 'atendimento';
  photo?: string;
}

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeDocType, setActiveDocType] = useState<'quitacao' | 'regularidade' | 'boleto'>('quitacao');
  const [certificateResult, setCertificateResult] = useState<null | 'active' | 'pending'>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [whatsappNumber] = useState('5500000000000'); // Configure o número aqui
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [certRequests, setCertRequests] = useState<CertificateRequest[]>([
    { id: 'REQ-001', type: 'quitacao', status: 'available', date: '10/05/2026', companyName: 'Ind. Metalúrgica Ltda', cnpj: '12.345.678/0001-90', documentUrl: '#' },
    { id: 'REQ-002', type: 'regularidade', status: 'processing', date: '14/05/2026', companyName: 'Ind. Metalúrgica Ltda', cnpj: '12.345.678/0001-90' },
  ]);

  const [partners, setPartners] = useState<Partner[]>([
    { id: '1', name: 'Unimed Regional', category: 'saude', discount: '20%', description: 'Plano de saúde empresarial com carência zero para associados.', logo: 'https://images.unsplash.com/photo-1505751172107-5739a007721d?auto=format&fit=crop&q=80', featured: true },
    { id: '2', name: 'Faculdade Impacto', category: 'educacao', discount: '35%', description: 'Desconto em cursos de graduação e pós-graduação.', logo: 'https://images.unsplash.com/photo-1523050353055-f184e92672ba?auto=format&fit=crop&q=80' },
    { id: '3', name: 'Hotel Vista Mar', category: 'lazer', discount: '15%', description: 'Tarifas diferenciadas para lazer e convenções.', logo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80' },
  ]);
  
  // New Modern Features States
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const [aiChat, setAiChat] = useState<AIChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcBaseSalary, setCalcBaseSalary] = useState(2500);
  const [calcAdjustment, setCalcAdjustment] = useState(5);
  
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'boletos' | 'docs' | 'voting' | 'accountant' | 'partners' | 'admin' | 'settings' | 'suggestions'>('overview');
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'finance' | 'billing' | 'associates' | 'partners' | 'system' | 'media' | 'docs' | 'team' | 'publications' | 'syndicate'>('dashboard');
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<'admin' | 'associate'>('associate');
  const [resetSent, setResetSent] = useState(false);
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [membershipData, setMembershipData] = useState({
    companyName: '',
    cnpj: '',
    email: '',
    phone: '',
    capitalSocial: '',
    representative: '',
    address: ''
  });
  const [isSubmittingMembership, setIsSubmittingMembership] = useState(false);
  const [siteConfig, setSiteConfig] = useState({
    primaryColor: '#1e3a8a', // blue-900
    accentColor: '#fbbf24', // amber-400
    heroTitle: 'O Futuro do Setor Patronal é Digital',
    heroSubtitle: 'Soluções inteligentes, representatividade forte e benefícios exclusivos para empresas que transformam o amanhã.',
    logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop',
    headerLogoWidth: 120,
    footerLogoWidth: 100,
    name: 'Sindicato Patronal das Indústrias',
    cnpj: '00.000.000/0001-00',
    address: 'Av. Industrial, 1000 - Centro, Salvador - BA',
    phone: '(71) 3333-0000',
    email: 'contato@sindicato.org.br',
    mission: 'Fortalecer o setor industrial através da representatividade e excelência em serviços.',
  });
  const [jucebProcesses, setJucebProcesses] = useState([
    { id: '1', company: 'Ind. Têxtil Silva', type: 'Abertura de Filial', status: 'Em Análise', date: '12/05/2026', responsible: 'André Fonseca' },
    { id: '2', company: 'Comércio de Peças João', type: 'Alteração Contratual', status: 'Aguardando Documento', date: '14/05/2026', responsible: 'André Fonseca' },
    { id: '3', company: 'Nova Era Tech', type: 'Baixa de Empresa', status: 'Concluído', date: '10/05/2026', responsible: 'André Fonseca' },
  ]);
  const SUPER_USER_EMAIL = 'cleciotecnologia@gmail.com';

  const [expenses, setExpenses] = useState<any[]>([
    { id: 1, description: 'Aluguel Sede', value: 2500, type: 'fixa', category: 'Infraestrutura', date: '10/05/2026' },
    { id: 2, description: 'Energia Elétrica', value: 450.20, type: 'variavel', category: 'Contas', date: '12/05/2026' },
    { id: 3, description: 'Papelaria / Toner', value: 180, type: 'variavel', category: 'Escritório', date: '14/05/2026' },
  ]);

  const [mediaItems, setMediaItems] = useState<any[]>([
    { id: 1, title: 'Inauguração Nova Sede', type: 'foto', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c', date: '10/05/2026' },
    { id: 2, title: 'Portal de Transparência', type: 'link', url: 'https://transparencia.sindicato.org.br', date: '12/05/2026' },
  ]);

  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedBoletoPix, setSelectedBoletoPix] = useState<any>(null);

  const generatePixPayload = (amount: string, reference: string) => {
    // Normalização completa do valor para formato decimal 0.00 (ex: "R$ 1.500,00" -> "1500.00")
    const cleanAmount = amount
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    
    const pixKey = bankDetails.pixKey;
    const merchantName = 'SINDICATO SINPA';
    const merchantCity = 'SALVADOR';

    // Helper para formatar campos EMV (ID + Tamanho + Conteúdo)
    const f = (id: string, content: string) => {
      const len = content.length.toString().padStart(2, '0');
      return id + len + content;
    };

    // Merchant Account Info (Tag 26)
    const gui = f('00', 'br.gov.bcb.pix');
    const key = f('01', pixKey);
    const merchantAccountInfo = f('26', gui + key);

    // Normalização/Saneamento do identificador/referência do boleto para os padrões EMV/TXID (Apenas letras e números, sem acentos, max 25 caracteres)
    let cleanReference = reference
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^A-Za-z0-9]/g, "")     // apenas caracteres alfanuméricos
      .toUpperCase();

    if (cleanReference.length === 0) {
      cleanReference = 'COBRANCA';
    } else {
      cleanReference = cleanReference.substring(0, 25);
    }

    // Montando o payload base (sem o CRC16)
    let payload = f('00', '0201'); // Payload Format Indicator
    payload += merchantAccountInfo;
    payload += f('52', '040000'); // Merchant Category Code
    payload += f('53', '986');    // Transaction Currency (BRL)
    payload += f('54', cleanAmount); // Transaction Amount
    payload += f('58', 'BR');     // Country Code
    payload += f('59', merchantName.substring(0, 25)); // Merchant Name
    payload += f('60', merchantCity.substring(0, 15)); // Merchant City
    payload += f('62', f('05', cleanReference)); // Additional Data (Ref / TXID)
    payload += '6304'; // CRC16 Tag

    // Cálculo exato e homologado do CRC16-CCITT (polynomial 0x1021, inicialização 0xFFFF)
    const crc16CCITT = (data: string) => {
      let crc = 0xFFFF;
      for (let i = 0; i < data.length; i++) {
        let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
        x ^= x >> 4;
        crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
    };

    return payload + crc16CCITT(payload);
  };

  const [isBankConnected, setIsBankConnected] = useState(false);
  const [isGeneratingRemittance, setIsGeneratingRemittance] = useState(false);
  
  const handleBankHomologation = () => {
    setIsBankConnected(false);
    showNotification('info', 'Iniciando processo de homologação com ' + bankDetails.bankName + '...');
    setTimeout(() => {
      setIsBankConnected(true);
      showNotification('success', 'Banco homologado com sucesso! API em ambiente de produção.');
    }, 2500);
  };

  const generateRemittance = () => {
    if (!isBankConnected) {
      showNotification('error', 'Banco não homologado. Conecte com o banco antes de gerar remessa.');
      return;
    }
    setIsGeneratingRemittance(true);
    showNotification('info', 'Compilando boletos pendentes para arquivo CNAB 400...');
    setTimeout(() => {
      setIsGeneratingRemittance(false);
      const fileName = `REMESSA_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_01.rem`;
      showNotification('success', `Arquivo ${fileName} gerado com sucesso!`);
      const blob = new Blob(['CONTEUDO_MOCK_REMESSA_CNAB_400'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    }, 3000);
  };

  const [bankDetails, setBankDetails] = useState({
    bankName: 'Banco do Brasil',
    agency: '1234-5',
    account: '123456-7',
    pixKey: 'sindicato@pix.org.br',
    walletId: 'WEB-99283-ID'
  });

  const [allBillings, setAllBillings] = useState<any[]>([]);
  const [isFetchingBillings, setIsFetchingBillings] = useState(false);

  const fetchBillings = async () => {
    setIsFetchingBillings(true);
    try {
      // Usar collectionGroup para buscar todos os boletos vinculados a membros
      const q = query(collectionGroup(db, 'boletos'), orderBy('dueDate', 'asc'));
      const snap = await getDocs(q);
      setAllBillings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.warn("Could not fetch billings", error);
    } finally {
      setIsFetchingBillings(false);
    }
  };

  const [newExpense, setNewExpense] = useState({ description: '', value: '', type: 'fixa', category: '' });
  const [newMedia, setNewMedia] = useState({ title: '', url: '', type: 'foto' });
  const [mediaViewMode, setMediaViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: isAdminDoc } = useQuery({
    queryKey: ['admin', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      try {
        const docRef = doc(db, 'admins', currentUser.email);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
      } catch (error) {
        console.warn("Could not check admin status");
        return null;
      }
    },
    enabled: !!currentUser,
  });

  const isAdmin = currentUser?.email === SUPER_USER_EMAIL || !!isAdminDoc;
  const isSuperUser = currentUser?.email === SUPER_USER_EMAIL;
  const [isPortalView, setIsPortalView] = useState(false);
  const [activePortal, setActivePortal] = useState<'company' | 'accountant'>('company');
  
  const [suggestionForm, setSuggestionForm] = useState({ name: '', email: '', message: '' });
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [suggestionStatus, setSuggestionStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [certForm, setCertForm] = useState({ companyName: 'Ind. Metalúrgica Ltda', cnpj: '12.345.678/0001-90', validity: '90 dias' });
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [domainConfig, setDomainConfig] = useState({
    domain: 'sindicatodigital.org.br',
    subdomain: 'portal',
    isActive: true,
    sslStatus: 'active' as 'active' | 'pending' | 'expired'
  });
  const [systemTime, setSystemTime] = useState(new Date());
  const [userRole, setUserRole] = useState<'admin' | 'presidencia' | 'diretoria' | 'gerencia' | 'atendimento' | 'associado'>('associado');
  const [selectedAssociate, setSelectedAssociate] = useState<any | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docType, setDocType] = useState<'cct' | 'news' | 'internal' | 'juridico'>('cct');
  const [expandedPubIndex, setExpandedPubIndex] = useState<number | null>(null);

  const handleApproveRequest = async (request: any) => {
    try {
      setGlobalMessage({ type: 'info', text: `Aprovando solicitação de ${request.companyName}...` });
      
      // 1. Criar o Associado (Membro)
      const memberRef = await addDoc(collection(db, 'members'), {
        name: request.companyName,
        cnpj: request.cnpj,
        email: request.email,
        phone: request.phone,
        representative: request.representative,
        level: 'Bronze',
        status: 'active', // 'active' conforme regras
        createdAt: serverTimestamp(),
        requestId: request.id
      });

      // 2. Gerar 12 mensalidades (Boletos) na sub-coleção
      const monthlyValue = 150.00;
      const today = new Date();
      
      for (let i = 0; i < 12; i++) {
        const dueDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 15);
        await addDoc(collection(db, 'members', memberRef.id, 'boletos'), {
          memberId: memberRef.id,
          memberName: request.companyName, // Adicionado para facilitar listagem
          title: `Mensalidade ${dueDate.getMonth() + 1}/${dueDate.getFullYear()}`,
          amount: monthlyValue,
          dueDate: Timestamp.fromDate(dueDate),
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }

      // 3. Atualizar status da solicitação
      await updateDoc(doc(db, 'membership_requests', request.id), {
        status: 'approved',
        approvedAt: serverTimestamp()
      });

      showNotification('success', `Associado ${request.companyName} aprovado e 12 mensalidades geradas!`);
      fetchMembershipRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      showNotification('error', 'Falha ao aprovar: ' + error.message);
    }
  };

  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
  const [isFetchingRequests, setIsFetchingRequests] = useState(false);

  const fetchMembershipRequests = async () => {
    setIsFetchingRequests(true);
    try {
      const q = query(collection(db, 'membership_requests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMembershipRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.warn("Could not fetch membership requests", error);
    } finally {
      setIsFetchingRequests(false);
    }
  };

  const [members, setMembers] = useState<any[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);

  const fetchMembers = async () => {
    setIsFetchingMembers(true);
    try {
      const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.warn("Could not fetch members", error);
    } finally {
      setIsFetchingMembers(false);
    }
  };

  React.useEffect(() => {
    if (activeDashboardTab === 'admin') {
      if (adminSubTab === 'associates') {
        fetchMembershipRequests();
        fetchMembers();
      }
      if (adminSubTab === 'billing') {
        fetchBillings();
      }
    }
  }, [activeDashboardTab, adminSubTab]);

  const handlePublishDoc = async () => {
    setIsUploadingDoc(true);
    try {
      // Simulação de upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification('success', `Documento (${docType.toUpperCase()}) publicado com sucesso no portal!`);
    } catch (error) {
      showNotification('error', 'Falha ao publicar documento: ' + getFriendlyErrorMessage(error));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);

    // Fetch FAQs
    const fetchFAQs = async () => {
      try {
        const q = query(collection(db, 'faq'), orderBy('relevance', 'desc'));
        const snap = await getDocs(q);
        setFaqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.warn("Could not fetch FAQs", error);
      }
    };
    fetchFAQs();

    return () => clearInterval(timer);
  }, []);

  // Determina se o usuário logado tem poderes de gestão plena
  const hasManagementPower = ['admin', 'presidencia', 'diretoria', 'gerencia'].includes(userRole);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [adminLogo, setAdminLogo] = useState<string | null>(null);
  React.useEffect(() => {
    if (siteConfig?.logoUrl) {
      setAdminLogo(siteConfig.logoUrl);
    }
  }, [siteConfig?.logoUrl]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Dr. Roberto Santos', role: 'Presidente', category: 'presidencia' },
    { id: '2', name: 'Maria Oliveira', role: 'Vice-presidente', category: 'presidencia' },
    { id: '3', name: 'Luiz Gustavo', role: 'Diretor Financeiro', category: 'diretoria' },
    { id: '4', name: 'Dr. André Fonseca', role: 'Diretor Jurídico', category: 'diretoria' },
    { id: '5', name: 'Ana Beatriz', role: 'Gerente Administrativa', category: 'gerencia' },
    { id: '6', name: 'Ricardo Souze', role: 'Gerente de TI', category: 'gerencia' },
    { id: '7', name: 'Juliana Mendes', role: 'Atendimento ao Associado', category: 'atendimento' },
    { id: '8', name: 'Carlos Eduardo', role: 'Suporte Técnico', category: 'atendimento' },
  ]);
  const [teamFilter, setTeamFilter] = useState<'all' | TeamMember['category']>('all');
  const [delinquentCompanies] = useState([
    { id: 1, name: 'Transportes Rápidos Ltda', cnpj: '12.345.678/0001-90', debt: 4500.00, months: 3 },
    { id: 2, name: 'Indústrias Metalúrgicas ABC', cnpj: '98.765.432/0001-10', debt: 1200.50, months: 1 },
    { id: 3, name: 'Comércio de Frutas Silva', cnpj: '45.678.901/0001-22', debt: 8900.00, months: 6 },
  ]);

  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhotoURL, setNewPhotoURL] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [partnerFilter, setPartnerFilter] = useState<string>('todos');
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementType, setAgreementType] = useState<'avista' | 'parcelado'>('avista');
  const [agreementCompany, setAgreementCompany] = useState<any>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showLGPD, setShowLGPD] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('lgpd_accepted');
    }
    return true;
  });
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    logo: '',
    description: '',
    discount: '',
    category: 'servicos' as Partner['category'],
    expiresAt: '',
    website: ''
  });

  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    role: '',
    category: 'atendimento' as TeamMember['category'],
    photo: ''
  });

  const [faqs, setFaqs] = useState<any[]>([]);
  const [isGeneratingFAQ, setIsGeneratingFAQ] = useState(false);

  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const getFriendlyErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      try {
        const parsed = JSON.parse(error);
        if (parsed.error && parsed.error.includes('insufficient permissions')) {
          return 'ACESSO NEGADO: Você não tem permissão para realizar esta operação.';
        }
        return parsed.error || error;
      } catch {
        return error;
      }
    }
    
    const code = error?.code || error?.message;
    
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha inválidos.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas malsucedidas. Aguarde alguns minutos.';
      case 'auth/network-request-failed':
        return 'Falha de conexão. Verifique sua internet.';
      default:
        return error?.message || 'Erro inesperado.';
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setGlobalMessage({ type, text });
    setTimeout(() => setGlobalMessage(null), 5000);
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    setGlobalMessage(null);
    try {
      await updateProfile(currentUser, {
        displayName: newDisplayName,
        photoURL: newPhotoURL
      });
      if (auth.currentUser) {
        setCurrentUser({...auth.currentUser});
      }
      showNotification('success', "Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      showNotification('error', "Falha: " + getFriendlyErrorMessage(error));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleGenerateFAQ = async () => {
    try {
      setIsGeneratingFAQ(true);
      const suggestionSnap = await getDocs(collection(db, 'suggestions'));
      const queries = suggestionSnap.docs.map(doc => doc.data().message);

      if (queries.length < 3) {
        showNotification('info', 'Não há sugestões suficientes para gerar o FAQ. São necessárias pelo menos 3 perguntas.');
        return;
      }

      const response = await fetch('/api/faq/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Clean old and save new
      const oldFaqs = await getDocs(collection(db, 'faq'));
      for (const d of oldFaqs.docs) {
        await deleteDoc(doc(db, 'faq', d.id));
      }

      for (const item of data.faq) {
        await addDoc(collection(db, 'faq'), {
          ...item,
          updatedAt: Timestamp.now(),
        });
      }

      showNotification('success', 'FAQ gerado com sucesso pela IA!');
      const faqSnap = await getDocs(collection(db, 'faq'));
      setFaqs(faqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error: any) {
      console.error('Error generating FAQ:', error);
      showNotification('error', 'Falha ao gerar FAQ: ' + error.message);
    } finally {
      setIsGeneratingFAQ(false);
    }
  };

  const handleMembershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingMembership(true);
      await addDoc(collection(db, 'membership_requests'), {
        ...membershipData,
        capitalSocial: Number(membershipData.capitalSocial),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      showNotification('success', 'Solicitação de filiação enviada com sucesso! Nossa equipe entrará em contato.');
      setShowMembershipForm(false);
      setMembershipData({
        companyName: '',
        cnpj: '',
        email: '',
        phone: '',
        capitalSocial: '',
        representative: '',
        address: ''
      });
    } catch (error: any) {
      console.error('Error submitting membership:', error);
      showNotification('error', 'Falha ao enviar solicitação: ' + error.message);
    } finally {
      setIsSubmittingMembership(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus(null);

      // Simulação de progresso de upload para feedback visual
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 95) {
          progress = 95;
          clearInterval(interval);
        }
        setUploadProgress(progress);
      }, 200);

      const reader = new FileReader();
      reader.onloadend = () => {
        // Pequeno atraso para o usuário ver o progresso chegando ao fim
        setTimeout(() => {
          clearInterval(interval);
          setUploadProgress(100);
          setSiteConfig(prev => ({ ...prev, logoUrl: reader.result as string }));
          setIsUploading(false);
          setUploadStatus({ type: 'success', message: 'Logotipo carregado com sucesso!' });
          
          // Limpa o status após 4 segundos
          setTimeout(() => setUploadStatus(null), 4000);
        }, 800);
      };

      reader.onerror = () => {
        clearInterval(interval);
        setIsUploading(false);
        setUploadStatus({ type: 'error', message: 'Erro ao processar imagem. Tente outro arquivo.' });
      };

      reader.readAsDataURL(file);
    }
  };

  const generatePDF = async (type: 'certidao' | 'regularidade') => {
    if (!certForm.companyName || !certForm.cnpj) {
      alert("Por favor, preencha o nome da empresa e o CNPJ.");
      return;
    }
    
    setIsGeneratingCert(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(30, 58, 138); // Blue 900
      doc.rect(0, 0, 210, 40, 'F');
      
      if (siteConfig.logoUrl) {
        try {
          doc.addImage(siteConfig.logoUrl, 'PNG', 15, 5, 30, 30);
        } catch (e) {
          console.warn("Could not add logo to PDF", e);
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SINDICATO ID", siteConfig.logoUrl ? 120 : 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("SINDICATO DOS EMPREGADOS E TRABALHADORES - OFICIAL", siteConfig.logoUrl ? 120 : 105, 30, { align: 'center' });

      // Watermark content
      doc.setTextColor(245, 245, 245);
      doc.setFontSize(60);
      doc.text("DOCUMENTO OFICIAL", 105, 150, { align: 'center', angle: 45 });

      // Title
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(20);
      const title = type === 'certidao' ? "CERTIDÃO SINDICAL" : "DECLARAÇÃO DE REGULARIDADE";
      doc.text(title, 105, 65, { align: 'center' });

      // Main Text
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(12);
      doc.text("O SINDICATO ID, no uso de suas atribuições legais, certifica que a empresa:", 20, 85);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(certForm.companyName.toUpperCase(), 105, 100, { align: 'center' });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.text(`CNPJ: ${certForm.cnpj}`, 105, 110, { align: 'center' });
      
      const mainContent = type === 'certidao' 
        ? "Encontra-se devidamente registrada e em dia com suas obrigações sindicais perante esta entidade, estando plenamente apta a exercer suas atividades e participar de processos licitatórios que exijam prova de regularidade sindical."
        : "Declaramos para os devidos fins que a referida empresa encontra-se em situação REGULAR perante este Sindicato, tendo quitado todas as contribuições assistenciais, confederativas e taxas previstas na CCT vigente.";
      
      const splitText = doc.splitTextToSize(mainContent, 170);
      doc.text(splitText, 20, 130);

      doc.text(`Este documento eletrônico tem validade de ${certForm.validity}, a contar de sua emissão.`, 20, 170);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 20, 180);
      
      const authCode = Math.random().toString(36).substring(2, 12).toUpperCase();
      doc.setFontSize(10);
      doc.text(`Código de Autenticação Digital: ${authCode}-${Date.now()}`, 20, 195);

      // Signature area
      doc.line(60, 245, 150, 245);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DIRETORIA ADMINISTRATIVA", 105, 252, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Verificação de autenticidade disponível no portal SindicatoID", 105, 258, { align: 'center' });

      doc.save(`${type}_${certForm.cnpj.replace(/\D/g, '')}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro crítico ao gerar o documento PDF.");
    } finally {
      setIsGeneratingCert(false);
    }
  };
  const { data: adminList, refetch: refetchAdmins } = useQuery({
    queryKey: ['adminsList'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'admins'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() as { email: string; createdAt: Timestamp } }));
    },
    enabled: isSuperUser && activeDashboardTab === 'admin',
  });

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    try {
      await setDoc(doc(db, 'admins', newAdminEmail), {
        email: newAdminEmail,
        createdAt: Timestamp.fromDate(new Date()),
        addedBy: currentUser?.email
      });
      setNewAdminEmail('');
      refetchAdmins();
      showNotification('success', `Administrador ${newAdminEmail} adicionado com sucesso!`);
    } catch (error) {
      showNotification('error', `Falha ao adicionar administrador: ${getFriendlyErrorMessage(error)}`);
      handleFirestoreError(error, OperationType.WRITE, `admins/${newAdminEmail}`);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!window.confirm(`Remover acesso administrativo de ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', email));
      refetchAdmins();
      showNotification('success', `Acesso administrativo removido de ${email}.`);
    } catch (error) {
      showNotification('error', `Falha ao remover administrador: ${getFriendlyErrorMessage(error)}`);
      handleFirestoreError(error, OperationType.DELETE, `admins/${email}`);
    }
  };

  // Sample React Query for Member Profile
  const { data: memberProfile, isLoading: isMemberLoading } = useQuery({
    queryKey: ['member', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null;
      const q = query(collection(db, 'members'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },
    enabled: !!currentUser
  });

  // Load bank settings from Firestore
  const { data: dbBankDetails, refetch: refetchBankDetails } = useQuery({
    queryKey: ['bankSettings'],
    queryFn: async () => {
      try {
        const docRef = doc(db, 'settings', 'bank');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data();
        }
        return null;
      } catch (error) {
        console.warn("Could not fetch bank settings from Firestore", error);
        return null;
      }
    }
  });

  // Keep bankDetails state in sync
  React.useEffect(() => {
    if (dbBankDetails) {
      setBankDetails(prev => ({
        ...prev,
        bankName: dbBankDetails.bankName || prev.bankName,
        agency: dbBankDetails.agency || prev.agency,
        account: dbBankDetails.account || prev.account,
        pixKey: dbBankDetails.pixKey || prev.pixKey,
        walletId: dbBankDetails.walletId || prev.walletId
      }));
    }
  }, [dbBankDetails]);

  // Query for Member's Boletos from Firestore
  const { data: userBoletos } = useQuery({
    queryKey: ['userBoletos', memberProfile?.id],
    queryFn: async () => {
      if (!memberProfile?.id) return [];
      try {
        const q = query(collection(db, 'members', memberProfile.id, 'boletos'), orderBy('dueDate', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      } catch (error) {
        console.warn("Could not fetch user boletos", error);
        return [];
      }
    },
    enabled: !!memberProfile?.id
  });

  const displayBoletos = userBoletos && userBoletos.length > 0 ? (userBoletos as any[]).map((b: any) => ({
    doc: b.title || 'Mensalidade',
    venc: b.dueDate instanceof Timestamp ? b.dueDate.toDate().toLocaleDateString('pt-BR') : typeof b.dueDate === 'string' && b.dueDate.includes('T') ? new Date(b.dueDate).toLocaleDateString('pt-BR') : String(b.dueDate),
    valor: typeof b.amount === 'number' ? `R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : String(b.amount),
    status: (b.status || 'PENDING').toUpperCase(),
    id: b.id,
    rawAmount: b.amount,
  })) : [
    { doc: 'Contribuição Negocial 2026/01', venc: '15/05/2026', valor: 'R$ 840,00', status: 'PAID', id: 'MOCK1', rawAmount: 840.00 },
    { doc: 'Mensalidade Social Mai/26', venc: '20/05/2026', valor: 'R$ 210,00', status: 'PENDING', id: 'MOCK2', rawAmount: 210.00 },
    { doc: 'Cota de Patrocínio Evento', venc: '05/05/2026', valor: 'R$ 1.500,00', status: 'PAID', id: 'MOCK3', rawAmount: 1500.00 },
  ];

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setMemberLoggedIn(!!user);
      if (user) {
        setNewDisplayName(user.displayName || '');
        setNewPhotoURL(user.photoURL || '');
        
        // Simulação de papéis para o protótipo
        const email = user.email || '';
        if (email === SUPER_USER_EMAIL) setUserRole('admin');
        else if (email.includes('presidencia')) setUserRole('presidencia');
        else if (email.includes('diretoria')) setUserRole('diretoria');
        else if (email.includes('gerencia')) setUserRole('gerencia');
        else if (email.includes('atendimento')) setUserRole('atendimento');
        else setUserRole('associado');
      }
    });
    return () => unsubscribe();
  }, []);

  const [authError, setAuthError] = useState<string | null>(null);
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Erro no Login Google:", error);
      let message = 'Ocorreu um erro inesperado ao conectar com o Google.';
      
      if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        const projectId = firebaseConfig.projectId;
        message = `DOMÍNIO NÃO AUTORIZADO: O domínio "${currentDomain}" não está na lista de permissões do seu projeto Firebase (ID: ${projectId}). 

Para corrigir:
1. Acesse o Console do Firebase e selecione o projeto "${projectId}".
2. Vá em Autenticação > Configurações > Domínios autorizados.
3. Adicione o domínio: ${currentDomain}`;
      } else if (error.code === 'auth/popup-blocked') {
        message = 'POPUP BLOQUEADA: Por favor, habilite janelas pop-up para este site em seu navegador.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = 'LOGIN CANCELADO: A janela de autenticação foi fechada antes de completar o processo.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'ERRO DE REDE: Verifique sua conexão com a internet e tente novamente.';
      } else {
        message = `ERRO DE AUTENTICAÇÃO: ${error.message || "Tente novamente mais tarde."}`;
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    let loginEmail = email;

    if (!email.includes('@')) {
      try {
        const q = query(collection(db, 'members'), where('cnpj', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          loginEmail = snap.docs[0].data().email;
        } else {
          setAuthError('Usuário/CNPJ não encontrado ou senha incorreta.');
          setAuthLoading(false);
          return;
        }
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
      }
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Erro ao logar:", error);
      let message = 'E-mail ou senha inválidos.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Credenciais não reconhecidas. Por favor, revise seu e-mail/CNPJ e senha.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'ACESSO BLOQUEADO: Muitas tentativas inválidas. Aguarde alguns minutos ou redefina sua senha.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'CONTA DESATIVADA: Este usuário foi suspenso. Entre em contato com a administração.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'FORMATO INVÁLIDO: O endereço de e-mail informado não é válido.';
      }
      
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: fullName });
      }
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      let message = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está cadastrado. Que tal fazer login ou recuperar sua senha?';
      } else if (error.code === 'auth/invalid-email') {
        message = 'O formato do e-mail informado não é válido.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }
      
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
      setMemberLoggedIn(false);
      setCurrentUser(null);
      setActiveDashboardTab('overview');
      // Pequeno delay para suavizar a transição
      setTimeout(() => {
        setIsPortalView(false);
        setAuthLoading(false);
      }, 500);
    } catch (error) {
      console.error("Erro ao sair:", error);
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthError("Por favor, informe seu e-mail para recuperar a senha.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      console.error("Erro ao enviar reset:", error);
      setAuthError(`Erro: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const submitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionStatus(null);

    // Validation
    if (!suggestionForm.name.trim()) {
      setSuggestionStatus({ type: 'error', message: 'Por favor, informe seu nome completo.' });
      return;
    }
    
    if (!suggestionForm.email.trim()) {
      setSuggestionStatus({ type: 'error', message: 'O e-mail é obrigatório.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(suggestionForm.email)) {
      setSuggestionStatus({ type: 'error', message: 'Por favor, insira um e-mail válido.' });
      return;
    }

    if (!suggestionForm.message.trim()) {
      setSuggestionStatus({ type: 'error', message: 'A mensagem da sugestão não pode estar vazia.' });
      return;
    }

    if (suggestionForm.message.length < 10) {
      setSuggestionStatus({ type: 'error', message: 'Por favor, descreva sua sugestão com pelo menos 10 caracteres.' });
      return;
    }
    
    setIsSendingSuggestion(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        userId: currentUser?.uid || null,
        name: suggestionForm.name,
        email: suggestionForm.email,
        message: suggestionForm.message,
        createdAt: Timestamp.now()
      });
      setSuggestionForm({ name: '', email: '', message: '' });
      showNotification('success', 'Sugestão enviada com sucesso! Agradecemos sua contribuição.');
    } catch (error) {
      console.error("Erro ao enviar sugestão:", error);
      showNotification('error', 'Não foi possível enviar sua sugestão: ' + getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.WRITE, 'suggestions');
    } finally {
      setIsSendingSuggestion(false);
    }
  };
  
  const [publicSearchTerm, setPublicSearchTerm] = useState('');
  const [publicSearchResult, setPublicSearchResult] = useState<any[] | null>(null);

  const sectorData = [
    { name: 'Jan', value: 400 },
    { name: 'Fev', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Abr', value: 800 },
    { name: 'Mai', value: 500 },
  ];

  const [notifications, setNotifications] = useState<Notification[]>([]);

  React.useEffect(() => {
    // Listen to notifications
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate().toLocaleString('pt-BR') || 'Recent'
      })) as any[];
      setNotifications(docs);
    }, (error) => {
      // Handle the error gracefully if it's a permission issue (e.g. some notifications are private)
      const firestoreError = error as any;
      if (firestoreError.code === 'permission-denied') {
        console.warn("Some notifications were restricted.");
      } else {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  React.useEffect(() => {
    // Add sample notifications if empty for demo
    if (notifications.length === 0) {
      setNotifications([
        {
          id: '1',
          title: 'Nova CCT Publicada',
          description: 'A nova Convenção Coletiva de Trabalho 2026/2027 já está disponível para consulta.',
          date: 'Hoje, 09:15',
          read: false,
          type: 'publication'
        },
        {
          id: '2',
          title: 'Boleto de Contribuição',
          description: 'Seu boleto referente à contribuição assistencial vence em 5 dias.',
          date: 'Ontem, 14:30',
          read: false,
          type: 'payment'
        }
      ]);
    }
  }, []);

  const handleAISend = async () => {
    if (!userInput.trim()) return;
    
    const newMessages: AIChatMessage[] = [...aiChat, { role: 'user', text: userInput }];
    setAiChat(newMessages);
    setUserInput('');
    setAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userInput,
        config: {
          systemInstruction: `Você é o Assessor Jurídico Virtual de Elite do Sindicato Patronal SINPA. 
          Você foi treinado especificamente nas Convenções Coletivas de Trabalho (CCT) do setor.
          Ajude o usuário (contadores e empresários) com dúvidas sobre legislação trabalhista, 
          cálculos de reajuste, processos de associação e benefícios. 
          Sempre busque ser técnico, conciso e referencie que as informações são baseadas na CCT vigente.`
        }
      });
      
      const text = response.text || "Desculpe, não consegui processar sua resposta.";
      
      setAiChat([...newMessages, { role: 'model', text }]);
    } catch (error) {
      console.error("AI Error:", error);
      setAiChat([...newMessages, { role: 'model', text: "Desculpe, tive um problema ao processar sua dúvida. Por favor, tente novamente em alguns instantes." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerForm.name) return;

    const partner: Partner = {
      id: Date.now().toString(),
      ...newPartnerForm,
      logo: newPartnerForm.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80'
    };

    setPartners([partner, ...partners]);
    setShowAddPartnerModal(false);
    setNewPartnerForm({
      name: '',
      logo: '',
      description: '',
      discount: '',
      category: 'servicos',
      expiresAt: '',
      website: ''
    });
  };

  const handleInitiateAgreement = (companyId: number, type: 'avista' | 'parcelado') => {
    const company = delinquentCompanies.find(c => c.id === companyId);
    if (!company) return;
    setAgreementCompany(company);
    setAgreementType(type);
    setAgreementAccepted(false);
    setShowAgreementModal(true);
  };

  const handleFinalizeAgreement = () => {
    if (!agreementCompany || !agreementAccepted) return;

    const company = agreementCompany;
    const type = agreementType;

    const newAgreement = {
      id: Date.now(),
      company: company.name,
      amount: type === 'avista' ? company.debt * 0.9 : company.debt,
      type: type === 'avista' ? 'À Vista (10% desc)' : 'Parcelado (Sem juros)',
      status: 'Acordo Firmado',
      date: new Date().toLocaleDateString(),
      acceptedAt: new Date().toISOString()
    };

    setAgreements([newAgreement, ...agreements]);
    setShowAgreementModal(false);
    showNotification('success', `Acordo ${type === 'avista' ? 'À VISTA' : 'PARCELADO'} gerado com sucesso!`);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.value) return;

    const expense = {
      id: Date.now(),
      ...newExpense,
      value: parseFloat(newExpense.value as string),
      date: new Date().toLocaleDateString()
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({ description: '', value: '', type: 'fixa', category: '' });
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedia.title || !newMedia.url) return;

    const media = {
      id: Date.now(),
      ...newMedia,
      date: new Date().toLocaleDateString()
    };

    setMediaItems([media, ...mediaItems]);
    setNewMedia({ title: '', url: '', type: 'foto' });
  };

  const calculateResults = () => {
    const adjustmentValue = calcBaseSalary * (calcAdjustment / 100);
    const newSalary = calcBaseSalary + adjustmentValue;
    const fgts = newSalary * 0.08;
    const inssPatronal = newSalary * 0.20; // Simplified
    const rat = newSalary * 0.03;
    const thirdParties = newSalary * 0.058;
    
    return {
      newSalary,
      totalCharges: fgts + inssPatronal + rat + thirdParties,
      totalCost: newSalary + fgts + inssPatronal + rat + thirdParties
    };
  };

  const calc = calculateResults();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;
    
    setIsSearching(true);
    setCertificateResult(null);
    
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      // Mock logic: CNPJs including "000" are active, others pending
      if (searchTerm.includes('000') || searchTerm.length > 10) {
        setCertificateResult('active');
      } else {
        setCertificateResult('pending');
      }
    }, 1500);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.1 }
  };

  const { data: userSuggestions, refetch: refetchSuggestions } = useQuery({
    queryKey: ['userSuggestions', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      const q = query(
        collection(db, 'suggestions'), 
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!currentUser && activeDashboardTab === 'suggestions',
  });

  const deleteSuggestion = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover esta sugestão?")) return;
    try {
      await deleteDoc(doc(db, 'suggestions', id));
      refetchSuggestions();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suggestions/${id}`);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white border border-amber-100 p-6 sm:p-8 rounded-[40px] text-blue-900 shadow-2xl flex flex-col gap-5 max-w-sm w-full relative z-10 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setIsForgotPassword(false);
                  setResetSent(false);
                  setAuthError(null);
                }}
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-3">
                  {resetSent ? <Check className="w-6 h-6" /> : <Fingerprint className="w-6 h-6" />}
                </div>
                <h3 className="text-lg font-black mb-0.5 leading-tight text-blue-950">
                  {resetSent ? 'Link Enviado!' : 
                   isForgotPassword ? 'Recuperar Senha' : 
                   authType === 'admin' ? 'Painel Administrativo' :
                   isRegistering ? 'Cadastro de Associado' : 'Portal do Associado'}
                </h3>
                <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider mb-1">
                  {resetSent ? 'Confira seu e-mail' :
                   isForgotPassword ? 'Enviaremos instruções' :
                   authType === 'admin' ? 'Sindicato Sinpa Gestão' :
                   isRegistering ? 'Junte-se ao Sindicato' : 'Acesse seus benefícios'}
                </p>
              </div>

              {resetSent ? (
                <div className="space-y-5 text-center">
                  <p className="text-xs text-gray-500 font-medium leading-relaxed px-2">
                    Enviamos um link de recuperação para <span className="font-bold text-blue-900 break-all">{email}</span>. Verifique também sua pasta de spam.
                  </p>
                  <button 
                    onClick={() => {
                      setResetSent(false);
                      setIsForgotPassword(false);
                    }}
                    className="w-full bg-blue-950 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
                  >
                    Voltar para Login
                  </button>
                </div>
              ) : (
                <>
                  {authError && (
                    <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl">
                      <div className="max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                        {authError.includes('DOMÍNIO NÃO AUTORIZADO') ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-rose-700">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <p className="text-[10px] font-black uppercase tracking-tight">Domínio Bloqueado</p>
                            </div>
                            <div className="bg-white/50 p-2.5 rounded-xl border border-rose-100 space-y-2">
                              <p className="text-[9px] text-rose-500 font-bold leading-tight">
                                Este site ainda não está autorizado nas configurações do seu Firebase.
                              </p>
                              <div className="flex items-center gap-1.5 bg-rose-100/50 p-1.5 rounded-lg border border-rose-200">
                                <code className="text-[9px] font-mono font-black text-rose-800 break-all flex-1">
                                  {window.location.hostname}
                                </code>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(window.location.hostname);
                                    const btn = document.getElementById('copy-domain-auth');
                                    if (btn) btn.innerText = "OK";
                                    setTimeout(() => { if (btn) btn.innerText = "Copia"; }, 2000);
                                  }}
                                  id="copy-domain-auth"
                                  className="bg-rose-600 text-white px-2 py-1 rounded text-[8px] font-black"
                                >
                                  Copia
                                </button>
                              </div>
                            </div>
                            <a 
                              href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-900 text-white text-[9px] font-black rounded-lg hover:bg-blue-800 transition-all shadow-md active:scale-95"
                            >
                              <ExternalLink className="w-3 h-3" /> Configurar Firebase
                            </a>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <p className="text-[10px] font-bold text-rose-600 leading-tight">
                              {authError}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {authError.includes('cadastrado') && (
                        <button 
                          onClick={() => {
                            setIsRegistering(false);
                            setAuthError(null);
                          }}
                          className="mt-2 w-full py-1.5 text-[9px] font-black text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all uppercase tracking-tighter"
                        >
                          Ir para tela de Login
                        </button>
                      )}
                      
                      {!authError.includes('DOMÍNIO') && !authError.includes('cadastrado') && (
                        <button 
                          onClick={() => setAuthError(null)}
                          className="mt-2 w-full py-1.5 text-[9px] font-black text-rose-600 hover:text-rose-800 transition-all uppercase tracking-widest text-center"
                        >
                          Limpar Erro
                        </button>
                      )}
                    </div>
                  )}

                  <form 
                    onSubmit={
                      isForgotPassword ? handleForgotPassword : 
                      isRegistering ? handleEmailRegister : handleEmailLogin
                    } 
                    className="space-y-2.5"
                  >
                    {isRegistering && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 px-3">Nome Completo</label>
                        <input 
                          type="text" 
                          required 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl font-bold focus:bg-white focus:border-blue-900 transition-all outline-none text-xs"
                          placeholder="Informe seu nome"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 px-3">E-mail ou Usuário</label>
                      <input 
                        type="text" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl font-bold focus:bg-white focus:border-blue-900 transition-all outline-none text-xs"
                        placeholder="ex@email.com ou login"
                      />
                    </div>
                    {!isForgotPassword && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-3">
                          <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Senha</label>
                          {!isRegistering && (
                            <button 
                              type="button"
                              onClick={() => {
                                setIsForgotPassword(true);
                                setAuthError(null);
                              }}
                              className="text-[8px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                            >
                              Perdeu?
                            </button>
                          )}
                        </div>
                        <input 
                          type="password" 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl font-bold focus:bg-white focus:border-blue-900 transition-all outline-none text-xs"
                          placeholder="••••••••"
                        />
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className="w-full bg-blue-950 text-white py-3 rounded-xl font-bold text-xs shadow-xl shadow-blue-900/10 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 mt-1"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                        isForgotPassword ? 'Enviar Instruções' :
                        isRegistering ? 'Confirmar Cadastro' : 'Entrar no Sistema'
                      )}
                    </button>
                  </form>

                  {!isForgotPassword && (
                    <>
                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <div className="relative flex justify-center text-[8px] uppercase font-black"><span className="bg-white px-2 text-gray-300">Ou use sua conta</span></div>
                      </div>

                      <button 
                        onClick={handleGoogleLogin}
                        className="w-full bg-white border border-gray-200 py-2.5 rounded-xl font-bold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all text-[10px]"
                      >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3.5 h-3.5" alt="Google" />
                        Google Account
                      </button>

                      <button 
                        onClick={() => {
                          setIsRegistering(!isRegistering);
                          setAuthError(null);
                        }}
                        className="text-center text-[10px] font-bold text-blue-600 hover:underline w-full py-1"
                      >
                        {isRegistering ? 'Já possui conta? Entrar agora' : 'Não tem conta? Registre-se aqui'}
                      </button>
                    </>
                  )}

                  {isForgotPassword && (
                    <button 
                      onClick={() => {
                        setIsForgotPassword(false);
                        setAuthError(null);
                      }}
                      className="text-center text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors w-full py-1"
                    >
                      Voltar ao login
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {isPortalView && currentUser ? (
          <motion.div 
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans w-full"
          >
            {/* Persistent Sidebar */}
            <aside className="w-72 bg-blue-900 text-white flex flex-col h-full shadow-[20px_0_40px_-20px_rgba(30,58,138,0.3)] z-50">
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-blue-900 shadow-lg shadow-amber-400/20">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h1 className="text-sm font-bold font-display uppercase mt-1 leading-tight tracking-wider">
                    Sindicato Patronal<br/>
                    <span className="text-amber-400 text-xl tracking-tighter">SINPA</span>
                  </h1>
                </div>
                <p className="text-[10px] text-blue-200 font-bold tracking-widest uppercase opacity-40">Área do Associado</p>
              </div>

              <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                {[
                  { id: 'overview', label: 'Painel Geral', icon: LayoutDashboard },
                  { id: 'boletos', label: 'Financeiro', icon: CreditCard },
                  { id: 'docs', label: 'Documentos', icon: FileText },
                  { id: 'juceb', label: 'JUCEB Digital', icon: Briefcase },
                  { id: 'voting', label: 'Assembleia', icon: Vote },
                  { id: 'suggestions', label: 'Minhas Sugestões', icon: MessageSquare },
                  { id: 'partners', label: 'Vantagens', icon: Gift },
                  { id: 'accountant', label: 'Contadores', icon: UserCheck },
                  ...(isAdmin || hasManagementPower ? [{ id: 'admin', label: 'Administração', icon: ShieldAlert }] : []),
                  { id: 'settings', label: 'Configurações', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDashboardTab(item.id as any)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      activeDashboardTab === item.id 
                      ? 'bg-amber-400 text-blue-950 shadow-lg shadow-amber-400/20 translate-x-2' 
                      : 'text-blue-100/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="p-6 border-t border-white/10 bg-blue-950/30">
                <div className="flex items-center gap-4 mb-6 p-3 rounded-2xl bg-white/5 border border-white/5">
                  {currentUser.photoURL && <img src={currentUser.photoURL} alt="Foto de Perfil" className="w-10 h-10 rounded-xl border border-white/10" />}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate leading-none mb-1">{currentUser.displayName}</p>
                    <p className="text-[10px] text-blue-300/50 truncate font-mono uppercase tracking-widest">ID: 99283-PR</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsPortalView(false)}
                    className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    <Home className="w-3.5 h-3.5" /> Site
                  </button>
                  <button 
                    onClick={handleLogout}
                    disabled={authLoading}
                    className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    <span>{authLoading ? 'Saindo...' : 'Sair'}</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Portal Body */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <header className="h-24 bg-white border-b border-gray-100 flex items-center justify-between px-12 z-40">
                <div>
                  <h2 className="text-2xl font-bold font-display text-blue-900 capitalize">
                    {activeDashboardTab === 'overview' ? 'Visão Geral' : 
                     activeDashboardTab === 'boletos' ? 'Financeiro' :
                     activeDashboardTab === 'docs' ? 'Documentos' :
                     activeDashboardTab === 'voting' ? 'Assembleia' : 
                     activeDashboardTab === 'suggestions' ? 'Minhas Sugestões' : 
                     activeDashboardTab === 'partners' ? 'Clube de Vantagens' : 
                     activeDashboardTab === 'accountant' ? 'Portal do Contador' : 
                     activeDashboardTab === 'admin' ? 'Painel Administrativo' : 'Configurações'}
                  </h2>
                  <p className="text-sm text-gray-400 font-medium">Bem-vindo de volta ao portal corporativo.</p>
                </div>
                
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-all border border-gray-100 cursor-pointer"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowNotifications(false)}
                        ></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-12 top-20 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-gray-900"
                        >
                          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-lg">Notificações</h3>
                            {unreadCount > 0 && (
                              <button 
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 font-bold hover:underline"
                              >
                                Marcar tudo como lido
                              </button>
                            )}
                          </div>
                          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                              notifications.map((n, i) => (
                                <div 
                                  key={`notif-${n.id || i}-${i}`} 
                                  onClick={() => {
                                    markAsRead(n.id);
                                    // Optionally close or perform action
                                  }}
                                  className={`p-4 border-b border-gray-50 flex gap-4 hover:bg-gray-50 transition cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                                >
                                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                    n.type === 'publication' ? 'bg-blue-100 text-blue-600' :
                                    n.type === 'payment' ? 'bg-amber-100 text-amber-600' :
                                    'bg-purple-100 text-purple-600'
                                  }`}>
                                    {n.type === 'publication' && <FileText className="w-5 h-5" />}
                                    {n.type === 'payment' && <AlertCircle className="w-5 h-5" />}
                                    {n.type === 'announcement' && <Info className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-bold mb-0.5 truncate ${!n.read ? 'text-blue-900' : 'text-gray-900'}`}>{n.title}</h4>
                                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{n.description}</p>
                                    <span className="text-[10px] text-gray-400 font-medium">{n.date}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-10 text-center text-gray-400">
                                Nenhuma notificação encontrada.
                              </div>
                            )}
                          </div>
                          <button className="w-full py-4 text-sm font-bold text-blue-900 bg-gray-50 hover:bg-gray-100 transition">
                            Configurações de Alerta
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <div className="h-10 w-[1px] bg-gray-100"></div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Horário do Sistema</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">
                      {systemTime.toLocaleDateString('pt-BR')} - {systemTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc] custom-scrollbar">
                <div className={`${activeDashboardTab === 'admin' ? 'max-w-[1600px]' : 'max-w-6xl'} mx-auto transition-all duration-500`}>
                  <AnimatePresence mode="wait">
                    {activeDashboardTab === 'overview' ? (
                      <motion.div 
                        key="overview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-8"
                      >
                        <div className="grid lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-[#1a3673] via-[#0f2a5a] to-[#0a1b3a] text-white rounded-[40px] p-8 shadow-2xl flex flex-col justify-between border border-white/10 relative overflow-hidden h-[480px] group transition-all hover:shadow-[#1a3673]/30">
                                  {/* Decorative Animated Gradients */}
                                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse"></div>
                                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                                  
                                  {/* Pattern Overlay */}
                                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
                                    <div className="absolute inset-0 flex items-center justify-center rotate-12 scale-150">
                                      <Fingerprint className="w-full h-full" />
                                    </div>
                                  </div>
                                  
                                  <div className="relative z-10 flex flex-col h-full">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-8">
                                      <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-white rounded-2xl shadow-inner transform group-hover:scale-110 transition-transform duration-500">
                                          {siteConfig.logoUrl ? (
                                            <img src={siteConfig.logoUrl} className="h-7 w-auto" alt="Sindicato Logo" />
                                          ) : (
                                            <Building2 className="w-7 h-7 text-[#1a3673]" />
                                          )}
                                        </div>
                                        <div>
                                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-200/90 leading-none mb-1">Sindicato Patronal</h4>
                                          <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.1em]">Membro Corporativo Ativo</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="flex flex-col items-end">
                                          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-mono leading-none mb-1">ID v2.0</span>
                                          <div className="flex gap-1">
                                            {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-white/10 rounded-full"></div>)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card Center View */}
                                    <div className="flex-1 flex flex-col justify-center items-center">
                                      <div className="relative group/qr p-1">
                                        <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 via-blue-400/20 to-amber-400/20 rounded-[48px] opacity-0 blur-2xl group-hover/qr:opacity-100 transition-duration-700"></div>
                                        <div className="bg-white p-4 rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 transform group-hover/qr:scale-105 transition-transform duration-500">
                                          <QRCodeCanvas 
                                            value={`SID-ID-${siteConfig.cnpj}-2026`} 
                                            size={160} 
                                            level="Q"
                                            includeMargin={false}
                                            imageSettings={{
                                              src: siteConfig.logoUrl || "",
                                              x: undefined,
                                              y: undefined,
                                              height: 24,
                                              width: 24,
                                              excavate: true,
                                            }}
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="mt-8 text-center">
                                        <h3 className="text-2xl font-black tracking-tight uppercase leading-none mb-2">
                                          IND. METALURGICA LTDA
                                        </h3>
                                        <div className="flex items-center justify-center gap-3">
                                          <p className="text-[11px] font-bold text-blue-200/40 font-mono tracking-widest">
                                            98.765.432/0001-10
                                          </p>
                                          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                          <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                                            PLATINA
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card Footer Info */}
                                    <div className="mt-auto pt-8 border-t border-white/10 grid grid-cols-2 gap-8">
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.2em]">Filiado desde</p>
                                        <p className="text-sm font-bold text-white tracking-tight">OUTUBRO / 2021</p>
                                      </div>
                                      <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-blue-300/40 uppercase tracking-[0.2em]">Status de Regularidade</p>
                                        <div className="flex items-center justify-end gap-2">
                                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                                          <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">REGULAR</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Bottom Security Bar */}
                                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200"></div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-lg flex flex-col justify-between group hover:border-blue-200 transition-all h-[340px]">
                                  <div>
                                    <div className="flex items-center justify-between mb-8">
                                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-all shadow-sm">
                                        <Bell className="w-7 h-7" />
                                      </div>
                                      <span className="bg-rose-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                                        {unreadCount} ALERTAS
                                      </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 font-display">Comunicados</h3>
                                    <div className="space-y-4 mb-4">
                                      {notifications.slice(0, 2).map((n: any, i: number) => (
                                        <div key={`notif-slice-${n.id || i}-${i}`} className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 animate-pulse"></div>
                                          <p className="text-[13px] font-bold text-gray-700 leading-snug">{n.title}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setShowNotifications(true)}
                                    className="bg-gray-950 text-white px-5 py-4 rounded-2xl font-bold hover:bg-blue-900 transition-all w-full flex items-center justify-center gap-2"
                                  >
                                    Ver Tudo agora
                                  </button>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                  <Vote className="w-32 h-32 text-blue-950" />
                                </div>
                                <div className="relative z-10">
                                  <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase tracking-widest mb-4">
                                    <div className="w-2 h-2 bg-rose-600 rounded-full animate-ping"></div>
                                    Sessão Aberta
                                  </div>
                                  <h3 className="text-3xl font-bold text-blue-900 mb-4 font-display">Assembleia Geral Ordinária</h3>
                                  <p className="text-gray-500 mb-8 max-w-xl">
                                    Participe das decisões do sindicato sem sair da empresa. Votação segura com validade jurídica via biometria ou certificado.
                                  </p>
                                  <button 
                                    onClick={() => setActiveDashboardTab('voting')}
                                    className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20"
                                  >
                                    Entrar na Sala Virtual
                                  </button>
                                </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[32px] p-8 shadow-xl">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-200 mb-6 font-display">Resumo Financeiro</h4>
                              <div className="space-y-6">
                                <div className="pb-6 border-b border-white/10">
                                  <p className="text-[10px] uppercase font-bold text-indigo-300/60 mb-1">Mês Atual</p>
                                  <p className="text-3xl font-bold">R$ 1.050,00</p>
                                </div>
                                <div className="pb-2">
                                  <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs font-bold text-indigo-200">Próximo Vencimento</p>
                                    <span className="bg-amber-400 text-blue-950 text-[10px] font-bold px-2 py-1 rounded-lg">15/05</span>
                                  </div>
                                  <button 
                                    onClick={() => setActiveDashboardTab('boletos')}
                                    className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold text-sm transition-all border border-white/10"
                                  >
                                    Ver Faturas
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-lg">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-blue-900 mb-6 font-display">Links Rápidos</h4>
                              <div className="space-y-3">
                                {[
                                  { label: 'Convenção atualizada', icon: FileCheck },
                                  { label: 'Selo de Regularidade', icon: ShieldCheck },
                                  { label: 'Suporte Jurídico', icon: HelpCircle },
                                ].map((link, i) => (
                                  <button key={i} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-all text-left">
                                    <link.icon className="w-5 h-5 text-blue-900" />
                                    <span className="font-bold text-sm text-gray-700">{link.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : activeDashboardTab === 'suggestions' ? (
                      <motion.div 
                        key="suggestions"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-5xl mx-auto space-y-8"
                      >
                        <div className="bg-white border border-gray-100 rounded-[40px] p-8 lg:p-12 shadow-xl">
                          <div className="flex items-center justify-between mb-10">
                            <div>
                              <h3 className="text-3xl font-bold font-display text-blue-900">Minhas Sugestões</h3>
                              <p className="text-gray-500 font-medium mt-1">Gerencie suas contribuições para o sindicato.</p>
                            </div>
                            <button 
                              onClick={() => {
                                setIsPortalView(false);
                                setTimeout(() => {
                                  const contactSection = document.getElementById('contato');
                                  if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }}
                              className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-2"
                            >
                              <Plus className="w-5 h-5" /> Nova Sugestão
                            </button>
                          </div>

                          <div className="space-y-4">
                            {userSuggestions && userSuggestions.length > 0 ? (
                              userSuggestions.map((s: any, idx: number) => (
                                <div key={`sug-${s.id || idx}-${idx}`} className="p-8 rounded-[32px] bg-gray-50 border border-gray-100 hover:border-blue-200 transition-all group">
                                  <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <MessageSquare className="w-6 h-6" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                                          Enviada em {s.createdAt?.toDate().toLocaleDateString('pt-BR')}
                                        </p>
                                        <h4 className="font-bold text-lg text-gray-900">Sugestão #{s.id.substring(0, 6).toUpperCase()}</h4>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => deleteSuggestion(s.id)}
                                      className="w-10 h-10 bg-white text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all border border-gray-100"
                                      title="Remover Sugestão"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <div className="bg-white p-6 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed font-medium">
                                    {s.message}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6 shadow-sm">
                                  <MessageCircle className="w-10 h-10" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-400">Nenhuma sugestão enviada</h4>
                                <p className="text-sm text-gray-300 mt-1 uppercase tracking-widest font-black">Suas contribuições aparecerão aqui</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : activeDashboardTab === 'voting' ? (
                      <motion.div 
                        key="voting"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto space-y-8"
                      >
                        <div className="bg-gray-900 rounded-[40px] p-8 lg:p-20 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"></div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-8">
                                <span className="px-3 py-1 bg-rose-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">Sessão em Tempo Real</span>
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Iniciada às 14:00</span>
                              </div>
                              <h3 className="text-5xl font-bold mb-6 font-display">Assembleia Geral Ordinária</h3>
                              <p className="text-blue-100/60 text-lg mb-12">
                                Pauta: Aprovação das contas do exercício 2025 e definição da mesa negociadora para o pacto laboral 2026.
                              </p>
                              
                              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                                <button className="flex flex-col items-center bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all group">
                                  <CheckCircle className="w-12 h-12 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                                  <span className="font-bold text-xl">FAVORÁVEL</span>
                                  <span className="text-xs opacity-40 mt-1">Aprovar integralmente</span>
                                </button>
                                <button className="flex flex-col items-center bg-white/5 border border-white/10 p-10 rounded-3xl hover:bg-rose-500/20 hover:border-rose-500/50 transition-all group">
                                  <X className="w-12 h-12 text-rose-400 mb-4 group-hover:scale-110 transition-transform" />
                                  <span className="font-bold text-xl">CONTRÁRIO</span>
                                  <span className="text-xs opacity-40 mt-1">Rejeitar com ressalvas</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                                <Fingerprint className="w-8 h-8 text-blue-400" />
                                <div>
                                  <p className="text-xs font-bold text-blue-100/80 mb-1">Assinatura Digital de Voto</p>
                                  <p className="text-[10px] text-blue-100/40">Seu voto será registrado com autenticação por chave de segurança do associado ID: 99283-PR via SindicalID.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                      </motion.div>
                    ) : activeDashboardTab === 'boletos' ? (
                      <motion.div 
                        key="boletos"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid lg:grid-cols-3 gap-8"
                      >
                        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[40px] p-8 lg:p-12 shadow-xl">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
                            <h3 className="text-2xl font-bold font-display">Histórico de Cobranças</h3>
                            <button className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">Exportar Período</button>
                          </div>
                          
                          <div className="space-y-4">
                            {displayBoletos.map((item, i) => (
                              <div key={`boleto-${item.id || i}-${i}`} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[24px] bg-gray-50/50 border border-gray-100 hover:border-blue-900/20 transition-all group">
                                <div className="flex items-center gap-5 mb-4 md:mb-0">
                                  <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-blue-900 transition-all">
                                      <FileText className="w-6 h-6" />
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-900">{item.doc}</p>
                                      <div className="flex items-center gap-3 mt-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vencimento: {item.venc}</p>
                                        <span className="text-[9px] font-mono text-gray-400 uppercase">ID: {String(item.id).substring(0, 8).toUpperCase()}</span>
                                      </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-8">
                                  <div className="text-right">
                                      <p className="text-lg font-bold text-blue-900">{item.valor}</p>
                                      <span className={`text-[9px] font-bold uppercase tracking-widest ${item.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {item.status === 'PAID' ? 'Liquidado' : 'Aguardando'}
                                      </span>
                                  </div>
                                  <div className="flex gap-2">
                                    {item.status === 'PENDING' && (
                                      <button 
                                        onClick={() => {
                                          setSelectedBoletoPix({
                                             doc: item.doc,
                                             valor: item.valor,
                                             id: item.id
                                          });
                                          setShowPixModal(true);
                                        }}
                                        className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group/pix"
                                        title="Pagar com PIX"
                                      >
                                          <QrCode className="w-5 h-5 group-hover/pix:scale-110 transition-transform" />
                                      </button>
                                    )}
                                    <button className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-blue-900 hover:bg-blue-900 hover:text-white transition-all shadow-sm">
                                        <DownloadCloud className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-blue-900 text-white rounded-[40px] p-8 shadow-xl">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-8 font-display">Ações Rápidas</h4>
                            <div className="space-y-3">
                              <button className="w-full py-4 bg-white text-blue-900 rounded-2xl font-bold shadow-lg hover:bg-amber-400 transition-all">Pagar todas pendentes</button>
                              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 transition-all">Certidão de Quitação</button>
                              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 transition-all">Suporte Financeiro</button>
                            </div>
                          </div>
                          
                          <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 font-display">Dados Bancários</h4>
                            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                              <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Banco</p>
                                  <p className="text-sm font-bold text-gray-800">SICOOB - 756</p>
                              </div>
                              <div className="flex gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AG.</p>
                                    <p className="text-sm font-bold text-gray-800">4322</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">C.C.</p>
                                    <p className="text-sm font-bold text-gray-800">99.822-4</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : activeDashboardTab === 'docs' ? (
                      <motion.div 
                         key="docs"
                         initial={{ opacity: 0, y: 30 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="space-y-12"
                       >
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-100/50">
                               <button 
                                 onClick={() => setActiveDocType('quitacao' as any)}
                                 className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeDocType === ('quitacao' as any) ? 'bg-white shadow-md text-blue-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                               >
                                 Documentos Oficiais
                               </button>
                               <button 
                                 onClick={() => setActiveDocType('regularidade' as any)}
                                 className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeDocType === ('regularidade' as any) ? 'bg-white shadow-md text-blue-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                               >
                                 Meus Pedidos & Rastreio
                               </button>
                           </div>
                           <div className="flex gap-4">
                              <button className="bg-white border border-gray-200 text-blue-900 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest">
                                  <Link className="w-4 h-4" /> Integrar API Externa
                              </button>
                              <button className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-blue-900/10 uppercase tracking-widest">
                                  <DownloadCloud className="w-4 h-4" /> Baixar Tudo
                              </button>
                           </div>
                         </div>

                         {activeDocType === ('quitacao' as any) ? (
                           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {[
                               { label: 'Convenção Coletiva', date: 'Vigência 2026/2027', icon: FileCheck, color: 'blue' },
                               { label: 'Estatuto Social', date: 'Atualizado em 2024', icon: ShieldCheck, color: 'indigo' },
                               { label: 'Atas de Assembleia', date: 'Exercício 2025', icon: FileText, color: 'amber' },
                               { label: 'Manuais de Conduta', date: 'Diretrizes 2026', icon: FileCheck, color: 'emerald' },
                               { label: 'Relatórios Fiscais', date: 'Balancete 2025', icon: BarChart3, color: 'rose' },
                               { label: 'Tabelas Salariais', date: 'Setor Metalúrgico', icon: Calculator, color: 'violet' },
                             ].map((doc, i) => (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 transition={{ delay: i * 0.05 }}
                                 key={i} 
                                 className="bg-white border border-gray-100 p-10 rounded-[40px] hover:border-blue-900 transition-all group flex flex-col justify-between shadow-sm hover:shadow-2xl h-[320px] relative overflow-hidden"
                               >
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[100px] pointer-events-none group-hover:bg-blue-50 transition-colors" />
                                 <div className="relative z-10">
                                   <div className={`w-16 h-16 bg-${doc.color}-50 text-${doc.color}-600 rounded-[20px] flex items-center justify-center mb-8 border border-${doc.color}-100 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                     <doc.icon className="w-8 h-8" />
                                   </div>
                                   <h4 className="font-bold text-2xl text-gray-900 mb-2 font-display">{doc.label}</h4>
                                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{doc.date}</p>
                                 </div>
                                 <button className="w-full py-5 bg-gray-50 group-hover:bg-blue-900 group-hover:text-white text-blue-900 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-transparent group-hover:shadow-xl group-hover:shadow-blue-900/20 active:scale-95">
                                   <Download className="w-4 h-4" /> Baixar Documento
                                 </button>
                               </motion.div>
                             ))}
                           </div>
                         ) : (
                           <div className="grid lg:grid-cols-3 gap-12">
                              <div className="lg:col-span-1">
                                 <div className="bg-white border border-gray-100 rounded-[44px] p-10 shadow-xl sticky top-8">
                                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                                       <Plus className="w-7 h-7" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-blue-900 mb-4 font-display">Solicitar Nova Certidão</h4>
                                    <p className="text-gray-400 text-sm mb-10 font-medium">Seu pedido será analisado pela diretoria em até 24 horas úteis.</p>
                                    
                                    <div className="space-y-6">
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Tipo de Documento</label>
                                          <select 
                                            className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold focus:bg-white transition-all outline-none"
                                            onChange={(e) => setActiveDocType(e.target.value as any)}
                                          >
                                             <option value="quitacao">Certidão de Quitação</option>
                                             <option value="regularidade">Atestado de Regularidade</option>
                                             <option value="outros">Outros Documentos</option>
                                          </select>
                                       </div>
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Observações (Opcional)</label>
                                          <textarea className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-bold focus:bg-white transition-all outline-none min-h-[120px] resize-none" placeholder="Ex: Necessário para licitação específica..."></textarea>
                                       </div>
                                       <button 
                                          className="w-full bg-blue-900 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
                                          onClick={() => {
                                             const newReq: CertificateRequest = {
                                                id: `REQ-${Math.floor(Math.random() * 900) + 100}`,
                                                type: 'quitacao',
                                                status: 'pending',
                                                date: new Date().toLocaleDateString('pt-BR'),
                                                companyName: 'Empresa do Associado',
                                                cnpj: '00.000.000/0000-00'
                                             };
                                             setCertRequests([newReq, ...certRequests]);
                                             alert("Solicitação enviada com sucesso!");
                                          }}
                                       >
                                          Confirmar Solicitação
                                       </button>
                                    </div>
                                 </div>
                              </div>

                              <div className="lg:col-span-2 space-y-8">
                                 <div className="bg-white border border-gray-100 rounded-[44px] p-12 shadow-xl">
                                    <div className="flex items-center justify-between mb-12">
                                       <h4 className="text-2xl font-bold text-blue-900 font-display">Acompanhamento de Pedidos</h4>
                                       <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                          {certRequests.length} Solicitações
                                       </span>
                                    </div>

                                    <div className="grid gap-4">
                                       {certRequests.map((req) => (
                                          <div key={req.id} className="p-8 rounded-[32px] border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-100 hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                             <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${
                                                   req.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                                                   req.status === 'processing' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                   {req.status === 'available' ? <CheckCircle2 className="w-7 h-7" /> : 
                                                    req.status === 'processing' ? <Zap className="w-7 h-7 animate-pulse" /> : <Clock className="w-7 h-7" />}
                                                </div>
                                                <div>
                                                   <div className="flex items-center gap-3 mb-1">
                                                      <h5 className="font-bold text-lg text-gray-900">{req.type === 'quitacao' ? 'Certidão de Quitação' : 'Certidão de Regularidade'}</h5>
                                                      <span className="text-[10px] font-mono text-gray-400 font-bold">#{req.id}</span>
                                                   </div>
                                                   <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                      <span>Solicitado em: {req.date}</span>
                                                      <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                                      <span className={
                                                         req.status === 'available' ? 'text-emerald-500' :
                                                         req.status === 'processing' ? 'text-blue-500' : 'text-amber-500'
                                                      }>Status: {req.status}</span>
                                                   </div>
                                                </div>
                                             </div>
                                             
                                             <div className="flex items-center gap-3">
                                                {req.status === 'available' ? (
                                                   <button className="flex items-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                                                      <Download className="w-4 h-4" /> Baixar PDF
                                                   </button>
                                                ) : (
                                                   <button className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">
                                                      <Clock className="w-4 h-4" /> Em Processamento
                                                   </button>
                                                )}
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                    
                                    <div className="mt-12 p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-8">
                                       <div className="flex items-center gap-6">
                                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                                             <Globe className="w-6 h-6" />
                                          </div>
                                          <div>
                                             <p className="text-sm font-bold text-blue-900">Consulta Pública de Autenticidade</p>
                                             <p className="text-xs text-blue-400 font-medium">Use a API de verificação para validar documentos de terceiros.</p>
                                          </div>
                                       </div>
                                       <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline whitespace-nowrap">Validar Documento Externo</button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         )}
                       </motion.div>
                    ) : activeDashboardTab === 'juceb' ? (
                       <motion.div 
                          key="juceb"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-12"
                        >
                          <div className="bg-white border border-gray-100 rounded-[44px] p-12 shadow-xl overflow-hidden relative">
                             <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-40"></div>
                             <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                <div className="flex items-center gap-6">
                                   <div className="w-20 h-20 bg-white rounded-[32px] shadow-2xl flex items-center justify-center p-4 border border-gray-50">
                                      <img src="https://www.google.com/s2/favicons?domain=juceb.ba.gov.br&sz=128" className="w-full h-full object-contain" alt="JUCEB" />
                                   </div>
                                   <div>
                                      <h3 className="text-4xl font-black text-blue-900 tracking-tighter">JUCEB Digital</h3>
                                      <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                         <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                         Consultoria & Atendimento no Sindicato
                                      </p>
                                   </div>
                                </div>
                                <button className="bg-emerald-600 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-600/30 hover:scale-105 transition-all flex items-center gap-3">
                                   <Plus className="w-5 h-5" /> Iniciar Novo Processo
                                </button>
                             </div>
                          </div>

                          <div className="grid lg:grid-cols-3 gap-12">
                             <div className="lg:col-span-2 space-y-12">
                                <div className="grid sm:grid-cols-2 gap-8">
                                   {[
                                     { title: 'Abertura de Filial', desc: 'Expandir sua marca com agilidade via convênio.', icon: Zap, color: 'amber' },
                                     { title: 'Alteração Jurídica', desc: 'Troca de sócios, endereço ou capital social.', icon: FileText, color: 'blue' },
                                     { title: 'Baixa de Empresa', icon: X, desc: 'Encerramento de atividades com suporte total.', color: 'rose' },
                                     { title: 'Consultoria Prévia', icon: Users, desc: 'Dúvidas sobre viabilidade e CNAEs.', color: 'indigo' },
                                   ].map((item, idx) => (
                                      <motion.button 
                                        key={idx} 
                                        whileHover={{ y: -5 }}
                                        className="bg-white border border-gray-100 p-8 rounded-[40px] text-left hover:border-emerald-500 transition-all shadow-sm hover:shadow-2xl overflow-hidden relative group"
                                      >
                                         <div className="relative z-10">
                                            <div className={`w-14 h-14 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                                               <item.icon className="w-7 h-7" />
                                            </div>
                                            <h4 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h4>
                                            <p className="text-xs text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                                         </div>
                                         <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <ChevronRight className="w-6 h-6 text-emerald-500" />
                                         </div>
                                      </motion.button>
                                   ))}
                                </div>
                                
                                <div className="bg-blue-900 rounded-[48px] p-12 text-white relative overflow-hidden shadow-3xl shadow-blue-950/40">
                                   <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] -mr-40 -mb-40"></div>
                                   <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                      <div className="max-w-md">
                                         <h4 className="text-3xl font-bold mb-4">Plantão de Atendimento</h4>
                                         <p className="text-blue-200 leading-relaxed mb-8">Nossos atendentes credenciados pela JUCEB estão online agora para te ajudar com protocolos e viabilidades.</p>
                                         <div className="flex gap-4">
                                            <div className="flex -space-x-3">
                                               {[1,2,3].map(i => <img key={i} className="w-12 h-12 rounded-full border-4 border-blue-900 shadow-xl" src={`https://i.pravatar.cc/150?u=${i+10}`} alt="Atendente" />)}
                                            </div>
                                            <div>
                                               <p className="text-sm font-bold">Atendentes Online</p>
                                               <p className="text-[10px] text-emerald-400 font-black uppercase tracking-tighter">Tempo médio: 4 min</p>
                                            </div>
                                         </div>
                                      </div>
                                      <button className="bg-white text-blue-900 px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-400/20 hover:scale-105 hover:bg-amber-400 transition-all whitespace-nowrap">Conectar ao Chat</button>
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-12">
                                <div className="bg-white border border-gray-100 rounded-[44px] p-10 shadow-xl">
                                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-50 pb-6 flex items-center justify-between">
                                      <span>Meus Processos</span>
                                      <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[8px]">Total: 2</span>
                                   </h4>
                                   <div className="space-y-6">
                                      {jucebProcesses.slice(0, 2).map((proc, idx) => (
                                         <div key={`proc-slice-${proc.id || idx}-${idx}`} className="p-6 rounded-[32px] border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-emerald-100 transition-all group flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                               <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Protocolo #{proc.id}2026</p>
                                               <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                 proc.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                               }`}>{proc.status}</span>
                                            </div>
                                            <h5 className="font-bold text-gray-800 leading-tight">{proc.type}</h5>
                                            <div className="flex items-center gap-3">
                                               <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-blue-900 border border-gray-100">AF</div>
                                               <div className="flex-1">
                                                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                     <div className={`h-full ${proc.status === 'Concluído' ? 'bg-emerald-500 w-full' : 'bg-blue-500 w-[65%]'} transition-all duration-1000 animate-pulse`}></div>
                                                  </div>
                                               </div>
                                            </div>
                                         </div>
                                      ))}
                                      <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 hover:bg-emerald-50 rounded-2xl transition-all">Relatório Completo</button>
                                   </div>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                     ) : activeDashboardTab === 'partners' ? (
                      <motion.div
                        key="partners"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <div className="bg-white border border-gray-100 rounded-[44px] p-8 lg:p-12 shadow-xl">
                          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                            <div>
                              <h3 className="text-3xl font-bold font-display text-blue-900 mb-2">Clube de Vantagens</h3>
                              <p className="text-gray-500 font-medium">Benefícios exclusivos para empresas associadas e seus colaboradores.</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4">
                              {isAdmin && (
                                <button 
                                  onClick={() => setShowAddPartnerModal(true)}
                                  className="bg-amber-400 text-blue-950 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20"
                                >
                                  <Plus className="w-5 h-5" /> Novo Parceiro (Admin)
                                </button>
                              )}
                              
                              <div className="flex flex-wrap bg-gray-50 p-1 rounded-2xl border border-gray-100">
                              {['todos', 'saude', 'educacao', 'lazer', 'servicos', 'comercio'].map((cat) => (
                                <button 
                                  key={cat}
                                  onClick={() => setPartnerFilter(cat)}
                                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    partnerFilter === cat
                                      ? 'bg-white text-blue-900 shadow-sm'
                                      : 'text-gray-400 hover:text-blue-900'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {partners
                              .filter((partner) => partnerFilter === 'todos' || partner.category === partnerFilter)
                              .map((partner, idx) => (
                              <motion.div 
                                key={`partner-dash-${partner.id || idx}-${idx}`}
                                whileHover={{ y: -5 }}
                                className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all group"
                              >
                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                  <img 
                                    src={partner.logo} 
                                    alt={partner.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black text-blue-900 uppercase tracking-widest shadow-sm">
                                      {partner.category}
                                    </span>
                                  </div>
                                  <div className="absolute top-4 right-4">
                                    <div className="bg-amber-400 text-blue-950 px-4 py-2 rounded-full text-xs font-black shadow-lg">
                                      {partner.discount} OFF
                                    </div>
                                  </div>
                                </div>
                                <div className="p-8">
                                  <h4 className="text-xl font-bold mb-3 text-blue-900">{partner.name}</h4>
                                  <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {partner.description}
                                  </p>
                                  {partner.website ? (
                                    <a 
                                      href={partner.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 text-center"
                                    >
                                      Acessar Site do Parceiro <ExternalLink className="w-5 h-5" />
                                    </a>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        showNotification('success', 'Cupom de desconto copiado! Apresente sua carteirinha na empresa.');
                                      }}
                                      className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                                    >
                                      Resgatar Benefício <ChevronRight className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : activeDashboardTab === 'accountant' ? (
                      <motion.div 
                        key="accountant"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid lg:grid-cols-3 gap-8"
                      >
                        <div className="lg:col-span-2 space-y-6">
                          <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                            <div className="flex items-center gap-6 mb-12">
                              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-sm">
                                <UserCheck className="w-8 h-8" />
                              </div>
                              <div>
                                <h3 className="text-3xl font-bold font-display">Portal Contábil</h3>
                                <p className="text-gray-500">Gestão centralizada de múltiplas empresas parceiras.</p>
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              {[
                                { label: 'Exportar Layout Folha', desc: 'Layouts Prosoft, Alterdata, Dominio.', icon: DownloadCloud, color: 'blue' },
                                { label: 'Relatórios Agrupados', desc: 'Sintético total por escritório.', icon: FileText, color: 'indigo' },
                                { label: 'Certificados em Lote', desc: 'Emissão massiva de regularidade.', icon: Printer, color: 'amber' },
                                { label: 'Suporte VIP Escritórios', desc: 'Fila prioritária de atendimento.', icon: MessageCircle, color: 'emerald' },
                              ].map((tool, i) => (
                                <button key={i} className="flex items-start gap-4 p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:border-blue-900 hover:bg-white transition-all text-left group">
                                  <div className={`w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-${tool.color}-600 group-hover:scale-110 transition-transform`}>
                                    <tool.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-sm mb-1">{tool.label}</p>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{tool.desc}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl">
                          <div className="flex items-center justify-between mb-8">
                            <h4 className="font-bold text-sm uppercase tracking-widest text-blue-950 font-display">Carteira de Clientes</h4>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-100">3 ATIVOS</span>
                          </div>
                          <div className="space-y-4 mb-8">
                            {['Ind. Metalurgica Ltda', 'Posto Alvorada GNV', 'Tecnologia Avançada S/A'].map((brand, i) => (
                              <div key={i} className="flex flex-col gap-4 p-4 bg-white border border-gray-100 rounded-2xl group hover:border-blue-200 transition-all cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-900 font-bold text-xs">
                                      {brand.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-gray-700">{brand}</p>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{i === 2 ? 'Pendente' : 'Ativo'}</span>
                                      </div>
                                    </div>
                                  </div>
                                   <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-all">
                                    <button 
                                      className="p-2.5 bg-blue-50 text-blue-900 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
                                      title="Visualizar Detalhes"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-all shadow-sm"
                                      title="Editar Perfil"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button className="w-full py-4 bg-blue-900 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Vincular Empresa
                          </button>
                        </div>
                      </motion.div>
                    ) : activeDashboardTab === 'admin' ? (
                       <motion.div 
                         key="admin" 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -20 }}
                         className="flex flex-col lg:flex-row gap-10 items-start min-h-[800px] relative"
                       >
                         {/* Persistent Sidebar Navigation */}
                         <aside className="w-full lg:w-72 lg:sticky lg:top-24 space-y-6">
                            <div className="bg-blue-950 border border-white/10 rounded-[32px] p-3 shadow-2xl overflow-hidden ring-1 ring-white/10">
                               <div className="flex flex-col gap-1">
                                  {[
                                    { 
                                      section: 'Principal', 
                                      items: [
                                        { id: 'dashboard', label: 'Monitoramento', icon: LayoutDashboard, color: 'text-blue-400' },
                                        { id: 'syndicate', label: 'Institucional', icon: Building2, color: 'text-indigo-400' },
                                      ]
                                    },
                                    { 
                                      section: 'Financeiro', 
                                      items: [
                                        { id: 'finance', label: 'Monitoramento & Fluxo', icon: CreditCard, color: 'text-rose-500' },
                                        { id: 'billing', label: 'Mensalidades & Boletos', icon: Banknote, color: 'text-orange-500' },
                                      ]
                                    },
                                    { 
                                      section: 'Base Cadastral', 
                                      items: [
                                        { id: 'associates', label: 'Associados', icon: Users, color: 'text-emerald-400' },
                                        { id: 'team', label: 'Conselho e Diretoria', icon: ShieldCheck, color: 'text-cyan-400' },
                                        { id: 'partners', label: 'Clube de Vantagens', icon: Gift, color: 'text-pink-400' },
                                      ]
                                    },
                                    { 
                                      section: 'Digital & Processos', 
                                      items: [
                                        { id: 'juceb', label: 'Integração JUCEB', icon: Briefcase, color: 'text-amber-500' },
                                        { id: 'docs', label: 'Gerador de Documentos', icon: Printer, color: 'text-violet-500' },
                                        { id: 'ai_faq', label: 'Assistente (IA)', icon: Bot, color: 'text-fuchsia-500' },
                                      ]
                                    },
                                    { 
                                      section: 'Presença Digital', 
                                      items: [
                                        { id: 'publications', label: 'Notícias & Blog', icon: Globe, color: 'text-sky-500' },
                                        { id: 'cms', label: 'Editor do Site', icon: LayoutGrid, color: 'text-teal-500' },
                                      ]
                                    },
                                    { 
                                      section: 'Sistema', 
                                      items: [
                                        { id: 'system', label: 'Parâmetros Gerais', icon: Settings, color: 'text-gray-500' },
                                      ]
                                    },
                                  ].map((group, idx) => (
                                    <div key={idx} className={`${idx !== 0 ? 'mt-6 pt-4 border-t border-white/10' : ''}`}>
                                      <p className="px-4 text-[10px] font-black text-blue-300/60 uppercase tracking-[0.25em] mb-4">{group.section}</p>
                                      <div className="space-y-1.5">
                                        {group.items.map((tab) => (
                                          <button
                                            key={tab.id}
                                            onClick={() => setAdminSubTab(tab.id as any)}
                                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all relative group ${
                                              adminSubTab === tab.id 
                                              ? 'bg-white/10 text-white active-nav-glow shadow-lg shadow-black/20' 
                                              : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                          >
                                            <div className={`p-2 rounded-xl transition-colors ${adminSubTab === tab.id ? 'bg-blue-600 shadow-lg shadow-blue-600/40' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                              <tab.icon className={`w-4 h-4 ${adminSubTab === tab.id ? 'text-white' : 'text-blue-200'}`} />
                                            </div>
                                            <span className="flex-1 text-left">{tab.label}</span>
                                            {adminSubTab === tab.id && (
                                              <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute left-0 w-1 h-6 bg-amber-400 rounded-r-full shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                                              />
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                               </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-[40px] p-8 text-blue-950 shadow-xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                              <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Suporte Técnico</p>
                                <h5 className="font-black text-lg tracking-tighter leading-none mb-4">Central de Ajuda Sinpa</h5>
                                <button className="w-full bg-blue-950 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-900 transition-colors">
                                  Abrir Chamado
                                </button>
                              </div>
                            </div>
                         </aside>

                         {/* Content Area */}
                         <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl min-h-[700px]">
                            <AnimatePresence mode="wait">
                               {adminSubTab === 'syndicate' && (
                                 <motion.div
                                   key="syndicate"
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: -10 }}
                                   className="space-y-8"
                                 >
                                   <div className="flex items-center justify-between">
                                     <div>
                                       <h3 className="text-2xl font-black text-blue-950 uppercase tracking-tighter">Perfil do Sindicato</h3>
                                       <p className="text-sm text-gray-500 font-medium">Gerencie as informações institucionais e a identidade visual.</p>
                                     </div>
                                     <button 
                                       onClick={() => {
                                         alert('Configurações salvas com sucesso!');
                                       }}
                                       className="px-6 py-3 bg-blue-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 hover:scale-105 transition-all flex items-center gap-2"
                                     >
                                       <Save className="w-4 h-4" /> Salvar Alterações
                                     </button>
                                   </div>

                                   <div className="grid lg:grid-cols-3 gap-8">
                                     {/* Visual Identity & Logo */}
                                     <div className="lg:col-span-1 space-y-8">
                                       <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl">
                                         <h4 className="font-bold text-xs uppercase tracking-widest text-blue-900 mb-6 flex items-center gap-2">
                                           <ImageIcon className="w-4 h-4" /> Logotipo Principal
                                         </h4>
                                         
                                         <div className="flex flex-col items-center gap-6">
                                           <div className="w-full aspect-square bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100 flex items-center justify-center relative overflow-hidden group">
                                             {siteConfig.logoUrl ? (
                                               <img 
                                                 src={siteConfig.logoUrl} 
                                                 alt="Syndicate Logo" 
                                                 className="max-w-[70%] max-h-[70%] object-contain"
                                               />
                                             ) : (
                                               <div className="text-center">
                                                 <Upload className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                 <p className="text-[10px] text-gray-400 font-bold uppercase">Nenhum logo</p>
                                               </div>
                                             )}
                                             
                                             <label className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                               <input 
                                                 type="file" 
                                                 className="hidden" 
                                                 onChange={(e) => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                      const localUrl = URL.createObjectURL(file);
                                                      setSiteConfig(prev => ({ ...prev, logoUrl: localUrl }));
          }
        }}
      />
                                               <div className="text-center text-white">
                                                 <Camera className="w-8 h-8 mx-auto mb-2" />
                                                 <span className="text-xs font-bold uppercase tracking-widest">Alterar Logo</span>
                                               </div>
                                             </label>
                                           </div>
                                           
                                           <div className="w-full grid grid-cols-2 gap-4">
                                             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Largura Header</p>
                                               <input 
                                                 type="range" min="40" max="250" 
                                                 value={siteConfig.headerLogoWidth}
                                                 onChange={(e) => setSiteConfig(prev => ({ ...prev, headerLogoWidth: parseInt(e.target.value) }))}
                                                 className="w-full h-1.5 bg-blue-900/10 rounded-lg appearance-none cursor-pointer accent-blue-900" 
                                               />
                                               <p className="text-center mt-2 text-[10px] font-mono font-bold text-blue-900">{siteConfig.headerLogoWidth}px</p>
                                             </div>
                                             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Largura Footer</p>
                                               <input 
                                                 type="range" min="40" max="200" 
                                                 value={siteConfig.footerLogoWidth}
                                                 onChange={(e) => setSiteConfig(prev => ({ ...prev, footerLogoWidth: parseInt(e.target.value) }))}
                                                 className="w-full h-1.5 bg-blue-900/10 rounded-lg appearance-none cursor-pointer accent-blue-900" 
                                               />
                                               <p className="text-center mt-2 text-[10px] font-mono font-bold text-blue-900">{siteConfig.footerLogoWidth}px</p>
                                             </div>
                                           </div>
                                         </div>
                                       </div>

                                       <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl">
                                         <h4 className="font-bold text-xs uppercase tracking-widest text-blue-900 mb-6 flex items-center gap-2">
                                           <Palette className="w-4 h-4" /> Cores da Marca
                                         </h4>
                                         <div className="space-y-4">
                                           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                             <div>
                                               <p className="text-[10px] font-black text-gray-900 uppercase">Cor Primária</p>
                                               <p className="text-[10px] text-gray-400 font-mono">{siteConfig.primaryColor}</p>
                                             </div>
                                             <input 
                                               type="color" 
                                               value={siteConfig.primaryColor}
                                               onChange={(e) => setSiteConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                                               className="w-10 h-10 rounded-xl border-0 overflow-hidden cursor-pointer"
                                             />
                                           </div>
                                           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                             <div>
                                               <p className="text-[10px] font-black text-gray-900 uppercase">Cor Accent</p>
                                               <p className="text-[10px] text-gray-400 font-mono">{siteConfig.accentColor}</p>
                                             </div>
                                             <input 
                                               type="color" 
                                               value={siteConfig.accentColor}
                                               onChange={(e) => setSiteConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                                               className="w-10 h-10 rounded-xl border-0 overflow-hidden cursor-pointer"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     </div>

                                     {/* Institutional Info */}
                                     <div className="lg:col-span-2 space-y-8">
                                       <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl">
                                         <h4 className="font-bold text-xs uppercase tracking-widest text-blue-900 mb-8 flex items-center gap-2 border-b border-gray-50 pb-4">
                                           <Building className="w-4 h-4" /> Informações Institucionais
                                         </h4>
                                         
                                         <div className="grid md:grid-cols-2 gap-6">
                                           <div className="space-y-2">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Razão Social</label>
                                             <input 
                                               type="text" 
                                               value={siteConfig.name}
                                               onChange={(e) => setSiteConfig(prev => ({ ...prev, name: e.target.value }))}
                                               className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-bold text-sm text-blue-900"
                                             />
                                           </div>
                                           <div className="space-y-2">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ</label>
                                             <input 
                                               type="text" 
                                               value={siteConfig.cnpj}
                                               onChange={(e) => setSiteConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                                               className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-bold text-sm text-blue-900 font-mono"
                                             />
                                           </div>
                                           <div className="space-y-2 md:col-span-2">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                                             <div className="relative">
                                               <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                               <input 
                                                 type="text" 
                                                 value={siteConfig.address}
                                                 onChange={(e) => setSiteConfig(prev => ({ ...prev, address: e.target.value }))}
                                                 className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-bold text-sm text-blue-900"
                                               />
                                             </div>
                                           </div>
                                           <div className="space-y-2">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
                                             <div className="relative">
                                               <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                               <input 
                                                 type="text" 
                                                 value={siteConfig.phone}
                                                 onChange={(e) => setSiteConfig(prev => ({ ...prev, phone: e.target.value }))}
                                                 className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-bold text-sm text-blue-900"
                                               />
                                             </div>
                                           </div>
                                           <div className="space-y-2">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail de Contato</label>
                                             <div className="relative">
                                               <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                               <input 
                                                 type="email" 
                                                 value={siteConfig.email}
                                                 onChange={(e) => setSiteConfig(prev => ({ ...prev, email: e.target.value }))}
                                                 className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-bold text-sm text-blue-900"
                                               />
                                             </div>
                                           </div>
                                           <div className="space-y-2 md:col-span-2">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Missão Institucional</label>
                                             <textarea 
                                               rows={4}
                                               value={siteConfig.mission}
                                               onChange={(e) => setSiteConfig(prev => ({ ...prev, mission: e.target.value }))}
                                               className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-bold text-sm text-blue-900 resize-none"
                                             />
                                           </div>
                                         </div>
                                       </div>

                                       <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-[40px] p-8 shadow-2xl text-white relative overflow-hidden">
                                         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
                                         <div className="relative z-10">
                                           <h4 className="text-lg font-black uppercase tracking-tighter mb-4">Métricas de Presença</h4>
                                           <div className="grid grid-cols-3 gap-4 text-center">
                                             <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-4 border border-white/10">
                                               <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Indexação IA</p>
                                               <p className="text-xl font-black text-amber-400">92%</p>
                                             </div>
                                             <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-4 border border-white/10">
                                               <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Health Score</p>
                                               <p className="text-xl font-black text-emerald-400">A+</p>
                                             </div>
                                             <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-4 border border-white/10">
                                               <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Visitas Mês</p>
                                               <p className="text-xl font-black text-white">2.4k</p>
                                             </div>
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'dashboard' && (
                                 <motion.div 
                                   key="dashboard"
                                   initial={{ opacity: 0, y: 10, scale: 0.99 }} 
                                   animate={{ opacity: 1, y: 0, scale: 1 }} 
                                   exit={{ opacity: 0, y: -10, scale: 0.99 }}
                                   transition={{ duration: 0.3, ease: "easeOut" }}
                                   className="space-y-8"
                                 >
                                    <div className="bg-blue-900 rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-12 opacity-10">
                                   <ShieldCheck className="w-48 h-48" />
                                 </div>
                                 <div className="relative z-10 text-center lg:text-left">
                                   <h3 className="text-4xl font-bold mb-4 font-display">Console Administrativo</h3>
                                   <p className="text-blue-100/70 max-w-xl text-lg mb-8 mx-auto lg:mx-0">
                                     Bem-vindo ao centro de comando. Gerencie operações, monitore a saúde financeira e emita certificados com ferramentas de elite.
                                   </p>
                                   <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                     <div className="bg-white/10 px-6 py-4 rounded-3xl border border-white/20 backdrop-blur-sm">
                                        <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Status Global</p>
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                          <p className="font-bold text-sm">Operacional</p>
                                        </div>
                                     </div>
                                     <div className="bg-white/10 px-6 py-4 rounded-3xl border border-white/20 backdrop-blur-sm">
                                        <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Empresas Ativas</p>
                                        <p className="font-bold text-sm">1.240 Unidades</p>
                                     </div>
                                     <div className="bg-white/10 px-6 py-4 rounded-3xl border border-white/20 backdrop-blur-sm">
                                        <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Receita Mensal</p>
                                        <p className="font-bold text-sm">R$ 45.200,00</p>
                                     </div>
                                   </div>
                                 </div>
                              </div>

                              <div className="grid lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                  <h4 className="text-xl font-bold mb-8 text-blue-900 border-b border-gray-50 pb-4">Indicadores de Saúde</h4>
                                  <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={[
                                        { name: 'Jan', val: 4000 },
                                        { name: 'Fev', val: 3000 },
                                        { name: 'Mar', val: 2000 },
                                        { name: 'Abr', val: 2780 },
                                        { name: 'Mai', val: 5890 },
                                      ]}>
                                        <defs>
                                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                        <YAxis hide />
                                        <ChartTooltip />
                                        <Area type="monotone" dataKey="val" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                   <h4 className="text-xl font-bold mb-8 text-blue-900 border-b border-gray-50 pb-4">Pendências Críticas</h4>
                                   <div className="space-y-4">
                                      {[
                                        { label: 'Homologação Pendente', count: 12, color: 'amber' },
                                        { label: 'Boletos Vencidos (30d)', count: 45, color: 'rose' },
                                        { label: 'Empresas sem CCT 2026', count: 8, color: 'indigo' },
                                        { label: 'Novos Cadastros', count: 5, color: 'emerald' },
                                      ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold">
                                           <div className="flex items-center gap-4">
                                              <div className={`w-3 h-3 rounded-full bg-${item.color}-500 shadow-lg shadow-${item.color}-100`}></div>
                                              <span className="text-xs text-gray-700">{item.label}</span>
                                           </div>
                                           <span className={`text-sm text-${item.color}-600`}>{item.count}</span>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              </div>
                           </motion.div>
                         )}

                               {adminSubTab === 'finance' && (
                                 <motion.div 
                                   key="finance"
                                   initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                                   animate={{ opacity: 1, scale: 1, y: 0 }} 
                                   exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                   transition={{ duration: 0.3 }}
                                   className="space-y-8"
                                 >
                                     <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                       <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                                         <h4 className="text-2xl font-black text-blue-900 font-display italic">Gestão de Despesas</h4>
                                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Controle de Saídas e Fluxo de Caixa</p>
                                         <p className="text-lg font-black text-rose-600 font-mono">R$ {expenses.reduce((acc, exp) => acc + exp.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                       </div>
                                       <form onSubmit={handleAddExpense} className="flex gap-4 mb-8 bg-gray-50 p-4 rounded-3xl">
                                         <input type="text" placeholder="Item" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="flex-1 bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs outline-none" required />
                                         <input type="number" step="0.01" placeholder="Valor" value={newExpense.value} onChange={(e) => setNewExpense({...newExpense, value: e.target.value})} className="w-24 bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs outline-none" required />
                                         <select value={newExpense.type} onChange={(e) => setNewExpense({...newExpense, type: e.target.value as any})} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs">
                                            <option value="fixa">Fixa</option>
                                            <option value="variavel">Variável</option>
                                         </select>
                                         <button type="submit" className="bg-blue-900 text-white px-6 py-2 rounded-xl font-bold text-xs">Lançar</button>
                                       </form>
                                       <div className="space-y-2">
                                          {expenses.map((exp) => (
                                            <div key={exp.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                                               <span className="font-bold text-xs text-gray-800">{exp.description} ({exp.type})</span>
                                               <span className="font-black text-xs text-rose-600 font-mono">R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                          ))}
                                       </div>
                                     </div>

                               <div className="grid lg:grid-cols-12 gap-8">
                                  <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl overflow-hidden relative">
                                     <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50/30 rounded-bl-[160px] pointer-events-none" />
                                     <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div>
                                           <h4 className="text-2xl font-black text-blue-950 font-display uppercase tracking-tight italic">Controle de Inadimplência</h4>
                                           <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1 italic">Monitoramento Crítico de Recebíveis</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
                                           <span className="text-rose-600 text-[10px] font-black uppercase tracking-widest">Ação Necessária</span>
                                        </div>
                                     </div>

                                    <div className="overflow-x-auto">
                                       <table className="w-full">
                                          <thead>
                                             <tr className="border-b border-gray-100">
                                                <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Empresa</th>
                                                <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Dívida Total</th>
                                                <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Meses</th>
                                                <th className="text-right py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Ações</th>
                                             </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50">
                                             {delinquentCompanies.map((company) => (
                                               <tr key={company.id} className="group hover:bg-gray-50/50 transition-all">
                                                  <td className="py-6">
                                                     <p className="font-bold text-gray-900 text-sm">{company.name}</p>
                                                     <p className="text-[10px] text-gray-400 font-mono">{company.cnpj}</p>
                                                  </td>
                                                  <td className="py-6 font-bold text-rose-600 text-sm">
                                                     R$ {company.debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </td>
                                                  <td className="py-6">
                                                     <span className="px-2 py-1 bg-gray-100 text-black text-[10px] font-black rounded-lg">
                                                       {company.months}m
                                                     </span>
                                                  </td>
                                                  <td className="py-6 text-right space-x-2">
                                                     <button 
                                                       onClick={() => handleInitiateAgreement(company.id, 'avista')}
                                                       className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-tighter"
                                                     >
                                                       Acordo À Vista
                                                     </button>
                                                     <button 
                                                       onClick={() => handleInitiateAgreement(company.id, 'parcelado')}
                                                       className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all uppercase tracking-tighter"
                                                     >
                                                       Parcelar
                                                     </button>
                                                  </td>
                                               </tr>
                                             ))}
                                          </tbody>
                                       </table>
                                    </div>
                                 </div>

                                 <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl">
                                    <h4 className="text-xl font-bold mb-8 text-blue-900 font-display uppercase tracking-widest text-xs">Acordos Recentes</h4>
                                    <div className="space-y-4">
                                       {agreements.length === 0 ? (
                                         <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-300">
                                               <FileText className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">Nenhum acordo gerado hoje.</p>
                                         </div>
                                       ) : (
                                         agreements.map((acc) => (
                                           <div key={acc.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 p-2">
                                                 <span className="text-[8px] font-black bg-white px-1.5 py-0.5 rounded border border-gray-100 uppercase text-blue-600">{acc.date}</span>
                                              </div>
                                              <p className="font-bold text-xs text-gray-900 mb-1 truncate pr-8">{acc.company}</p>
                                              <div className="flex items-center justify-between">
                                                 <p className="text-[10px] font-bold text-blue-900">R$ {acc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                 <span className="text-[8px] font-black text-amber-600 uppercase italic">{acc.status}</span>
                                              </div>
                                              <p className="text-[8px] text-gray-400 mt-2 font-mono uppercase tracking-widest">{acc.type}</p>
                                           </div>
                                         ))
                                       )}
                                    </div>
                                    {agreements.length > 0 && (
                                      <button className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-bold text-xs shadow-xl shadow-black/10 hover:bg-black transition-all flex items-center justify-center gap-2">
                                        <Printer className="w-4 h-4" /> Imprimir Relatório
                                      </button>
                                    )}

                                    </div>
                                 </div>
                           </motion.div>
                         )}

                         {/* Admin Viewing Associate Profile overlay/view */}
                         {selectedAssociate && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="fixed inset-0 z-[100] bg-gray-50 flex flex-col overflow-y-auto"
                            >
                               <div className="bg-blue-900 px-8 py-4 text-white flex items-center justify-between sticky top-0 z-50 shadow-2xl">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                        <ShieldCheck className="w-6 h-6 text-amber-400" />
                                     </div>
                                     <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Visão de Auditoria / Perfil</p>
                                        <h4 className="font-bold text-lg">{selectedAssociate.name}</h4>
                                     </div>
                                  </div>
                                  <button 
                                    onClick={() => setSelectedAssociate(null)}
                                    className="bg-white text-blue-900 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
                                  >
                                     <ArrowLeft className="w-4 h-4" /> Sair da Visualização
                                  </button>
                               </div>
                               <div className="flex-1 p-8">
                                  {/* Reusing existing dashboard components but for the selected associate */}
                                  <div className="max-w-6xl mx-auto space-y-8 pb-32">
                                     <div className="grid md:grid-cols-3 gap-8">
                                        <div className="md:col-span-2 space-y-8">
                                           <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl">
                                              <div className="flex items-center gap-4 mb-8">
                                                 <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-900 font-black text-2xl border border-blue-100">
                                                    {selectedAssociate.name.charAt(0)}
                                                 </div>
                                                 <div>
                                                    <h3 className="text-3xl font-black text-blue-900">{selectedAssociate.name}</h3>
                                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{selectedAssociate.cnpj}</p>
                                                 </div>
                                              </div>
                                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                 {[
                                                   { label: 'Status Sindical', val: 'Regular', color: 'emerald' },
                                                   { label: 'Plano Atual', val: 'Diamante', color: 'indigo' },
                                                   { label: 'Colaboradores', val: '145', color: 'blue' },
                                                   { label: 'Última CCT', val: '2026', color: 'amber' },
                                                 ].map((stat, i) => (
                                                   <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-3xl">
                                                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                                      <p className={`text-sm font-black text-${stat.color}-600`}>{stat.val}</p>
                                                   </div>
                                                 ))}
                                              </div>
                                           </div>
                                           {/* Simulated associate dash content */}
                                           <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                              <h4 className="text-xl font-bold mb-8 text-blue-900 font-display">Histórico de Contribuições</h4>
                                              <div className="space-y-3">
                                                 {[1, 2, 3].map((m) => (
                                                   <div key={m} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                      <div className="flex items-center gap-4">
                                                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                                                            <Calendar className="w-5 h-5 text-gray-400" />
                                                         </div>
                                                         <div>
                                                            <p className="text-sm font-bold text-gray-800">Mensalidade 0{m}/2026</p>
                                                            <p className="text-[10px] text-emerald-600 font-bold uppercase">Pago em 10/0{m}/26</p>
                                                         </div>
                                                      </div>
                                                      <p className="text-xs font-black text-gray-900">R$ 450,00</p>
                                                   </div>
                                                 ))}
                                              </div>
                                           </div>
                                        </div>
                                        <div className="space-y-8">
                                           <div className="bg-blue-950 text-white rounded-[40px] p-8 shadow-2xl">
                                              <h5 className="font-bold mb-6 text-xs uppercase tracking-widest text-blue-300">Resumo Financeiro</h5>
                                              <div className="space-y-6">
                                                 <div>
                                                    <p className="text-[10px] text-blue-300 uppercase font-black mb-1">Total Contribuído 2026</p>
                                                    <p className="text-3xl font-black">R$ 1.350,00</p>
                                                 </div>
                                                 <div className="pt-6 border-t border-white/10">
                                                    <p className="text-[10px] text-blue-300 uppercase font-black mb-1">Status de Débitos</p>
                                                    <div className="flex items-center gap-2">
                                                       <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                                       <p className="font-bold text-sm">Nada consta</p>
                                                    </div>
                                                 </div>
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </motion.div>
                         )}
                         {adminSubTab === 'media' && (
                                 <motion.div 
                                   key="media"
                                   initial={{ opacity: 0, scale: 0.95 }} 
                                   animate={{ opacity: 1, scale: 1 }} 
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   transition={{ duration: 0.3 }}
                                   className="space-y-8"
                                 >
                                    <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                                        <div>
                                          <h4 className="text-xl font-bold text-blue-900 font-display">Mídias & Publicações</h4>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fotos da galeria e links externos</p>
                                        </div>
                                         <div className="flex items-center gap-4">
                                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                               <button 
                                                 onClick={() => setMediaViewMode('grid')}
                                                 className={`p-2 rounded-lg transition-all ${mediaViewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                               >
                                                  <LayoutGrid className="w-4 h-4" />
                                               </button>
                                               <button 
                                                 onClick={() => setMediaViewMode('list')}
                                                 className={`p-2 rounded-lg transition-all ${mediaViewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                               >
                                                  <List className="w-4 h-4" />
                                               </button>
                                            </div>
                                            <button 
                                               onClick={() => {
                                                  const input = document.createElement('input');
                                                  input.type = 'file';
                                                  input.accept = 'image/*,video/*';
                                                  input.onchange = (e: any) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      alert('Iniciando carregamento de: ' + file.name);
                                                    }
                                                  };
                                                  input.click();
                                               }}
                                               className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 transition-all shadow-sm border border-emerald-100 group"
                                               title="Carregar nova mídia (Imagem ou Vídeo)"
                                             >
                                                <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                                             </button>
                                            <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2">
                                               <Camera className="w-4 h-4 text-blue-600" />
                                               <span className="text-xs font-bold text-blue-900">{mediaItems.length} Itens</span>
                                            </div>
                                         </div>
                                      </div>

                                      <form onSubmit={handleAddMedia} className="grid md:grid-cols-4 gap-4 mb-10 bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-black text-blue-900/40 uppercase px-4">Título</p>
                                          <input type="text" placeholder="Ex: Assembleia" value={newMedia.title} onChange={(e) => setNewMedia({...newMedia, title: e.target.value})} className="w-full bg-white border border-gray-200 px-5 py-3 rounded-2xl text-xs font-bold outline-none" required />
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-black text-blue-900/40 uppercase px-4">URL</p>
                                          <input type="text" placeholder="https://..." value={newMedia.url} onChange={(e) => setNewMedia({...newMedia, url: e.target.value})} className="w-full bg-white border border-gray-200 px-5 py-3 rounded-2xl text-xs font-bold outline-none" required />
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-black text-blue-900/40 uppercase px-4">Tipo</p>
                                          <select value={newMedia.type} onChange={(e) => setNewMedia({...newMedia, type: e.target.value as any})} className="w-full bg-white border border-gray-200 px-5 py-3 rounded-2xl text-xs font-bold outline-none cursor-pointer">
                                             <option value="foto">Foto Galeria</option>
                                             <option value="link">Link Externo</option>
                                          </select>
                                        </div>
                                        <div className="flex items-end">
                                          <button type="submit" className="w-full bg-blue-900 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-900/10">Publicar</button>
                                        </div>
                                      </form>

                                      {mediaViewMode === 'grid' ? (
                                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {mediaItems.map((item) => (
                                              <div key={`media-grid-${item.id}`} className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                                                 <div className="aspect-[16/10] relative overflow-hidden bg-gray-50 flex items-center justify-center">
                                                    {item.type === 'foto' ? (
                                                      <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                      <div className="flex flex-col items-center gap-2 p-8">
                                                         <Link className="w-10 h-10 text-blue-300" />
                                                         <p className="text-[10px] font-black text-blue-900/20 uppercase tracking-widest">Acesso Externo</p>
                                                      </div>
                                                    )}
                                                    <div className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-white/50">
                                                       {item.type === 'foto' ? <Camera className="w-4 h-4 text-blue-900" /> : <ExternalLink className="w-4 h-4 text-blue-900" />}
                                                    </div>
                                                 </div>
                                                 <div className="p-6 flex-1 flex flex-col justify-between">
                                                    <div>
                                                       <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">{item.date}</p>
                                                       <h5 className="font-black text-sm text-gray-900 mb-6 italic line-clamp-2">{item.title}</h5>
                                                    </div>
                                                    <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 uppercase hover:text-blue-900 transition-colors flex items-center gap-2">
                                                       Ver Conteúdo <ChevronRight className="w-3 h-3" />
                                                     </a>
                                                     {item.type === 'link' && (
                                                       <button 
                                                         onClick={(e) => { e.preventDefault(); alert('Download do PDF...'); e.stopPropagation(); }}
                                                         className="mt-2 flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase"
                                                       >
                                                          <Download className="w-3.5 h-3.5" /> PDF
                                                       </button>
                                                     )}

                                                 </div>
                                              </div>
                                            ))}
                                         </div>
                                       ) : (
                                         <div className="space-y-3">
                                            {mediaItems.map((item) => (
                                              <div key={`media-list-${item.id}`} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-50 transition-all group">
                                                 <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100">
                                                       {item.type === 'foto' ? (
                                                         <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                                                       ) : (
                                                         <Link className="w-5 h-5 text-blue-300" />
                                                       )}
                                                    </div>
                                                    <div>
                                                       <h5 className="font-bold text-sm text-gray-900">{item.title}</h5>
                                                       <div className="flex items-center gap-2 mt-0.5">
                                                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{item.date}</span>
                                                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{item.type}</span>
                                                       </div>
                                                    </div>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     {item.type === 'link' && (
                                                       <button 
                                                         onClick={(e) => { e.preventDefault(); alert('Download do PDF anunciado...'); }}
                                                         className="bg-blue-50 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                         title="Baixar em PDF"
                                                       >
                                                          <Download className="w-4 h-4" />
                                                       </button>
                                                     )}
                                                     <a href={item.url} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                        <ExternalLink className="w-4 h-4" />
                                                     </a>
                                                  </div>
                                               </div>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                  </motion.div>
                                )}

                                {adminSubTab === 'billing' && (
                                 <motion.div 
                                   key="billing"
                                   initial={{ opacity: 0, x: -20 }} 
                                   animate={{ opacity: 1, x: 0 }} 
                                   exit={{ opacity: 0, x: 20 }}
                                   transition={{ duration: 0.3 }}
                                   className="space-y-8"
                                 >
                                    <div className="grid lg:grid-cols-12 gap-8">
                                       <div className="lg:col-span-4 space-y-8">
                                          <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl overflow-hidden relative">
                                             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] pointer-events-none" />
                                             <div className="flex items-center gap-4 mb-10 relative z-10">
                                                <div className="w-14 h-14 bg-blue-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20">
                                                   <PiggyBank className="w-7 h-7" />
                                                </div>
                                                <div>
                                                   <h4 className="text-xl font-black text-blue-900 italic font-display">Conexão Bancária</h4>
                                                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Gateway de Recebimentos</p>
                                                </div>
                                             </div>
                                             
                                             <div className="space-y-6 relative z-10">
                                                <div className="space-y-2">
                                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Instituição</label>
                                                   <input type="text" className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-black focus:bg-white transition-all outline-none italic text-blue-900" value={bankDetails.bankName} onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                   <div className="space-y-2">
                                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Agência</label>
                                                      <input type="text" className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-black focus:bg-white transition-all outline-none font-mono" value={bankDetails.agency} onChange={(e) => setBankDetails({...bankDetails, agency: e.target.value})} />
                                                   </div>
                                                   <div className="space-y-2">
                                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Conta</label>
                                                      <input type="text" className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-black focus:bg-white transition-all outline-none font-mono" value={bankDetails.account} onChange={(e) => setBankDetails({...bankDetails, account: e.target.value})} />
                                                   </div>
                                                </div>
                                                <div className="space-y-2">
                                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Chave Pix Sindical</label>
                                                   <div className="relative group">
                                                      <input type="text" className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-xs font-black focus:bg-white transition-all outline-none font-mono text-blue-900 pr-12" value={bankDetails.pixKey} onChange={(e) => setBankDetails({...bankDetails, pixKey: e.target.value})} />
                                                      <QrCode className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 opacity-50 group-focus-within:opacity-100 transition-all" />
                                                   </div>
                                                </div>
                                                
                                                <div className={`p-6 rounded-[32px] border transition-all ${isBankConnected ? 'bg-emerald-50 border-emerald-100 shadow-inner' : 'bg-amber-50 border-amber-100 animate-pulse'}`}>
                                                   <div className="flex items-center gap-5">
                                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isBankConnected ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-amber-500 text-white shadow-amber-200'}`}>
                                                         {isBankConnected ? <ShieldCheck className="w-6 h-6" /> : <RefreshCw className="w-6 h-6 animate-spin" />}
                                                      </div>
                                                      <div className="flex-1">
                                                         <p className="text-xs font-black text-gray-900 uppercase tracking-tighter italic">Status da Integração</p>
                                                         <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isBankConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                            {isBankConnected ? 'Conectado em Produção' : 'Aguardando Sincronização'}
                                                         </p>
                                                      </div>
                                                   </div>
                                                </div>
  
                                                <button 
                                                  onClick={handleBankHomologation}
                                                  disabled={isBankConnected}
                                                  className={`w-full py-6 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 ${
                                                    isBankConnected 
                                                    ? 'bg-emerald-600 text-white shadow-emerald-900/20' 
                                                    : 'bg-blue-900 text-white hover:bg-black shadow-blue-900/20'
                                                  }`}
                                                >
                                                   <Link className={`w-4 h-4 ${!isBankConnected ? 'animate-bounce' : ''}`} /> 
                                                   {isBankConnected ? 'Homologação Ativa' : 'Homologar API Banco Central'}
                                                </button>
                                             </div>
                                          </div>
                                       </div>
  
                                       <div className="lg:col-span-8 space-y-8">
                                          <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl overflow-hidden relative">
                                             <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/30 rounded-bl-[160px] pointer-events-none" />
                                             <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-8 border-b border-gray-200 relative z-10 gap-6">
                                                <div>
                                                   <h4 className="text-3xl font-black text-blue-950 font-display tracking-tight uppercase italic leading-none">Faturamento Digital</h4>
                                                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3">Gestão Inteligente de Cobranças e CNAB</p>
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                   <button 
                                                     onClick={generateRemittance}
                                                     disabled={isGeneratingRemittance}
                                                     className="bg-amber-50 border border-amber-100 text-amber-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center gap-3 group shadow-sm"
                                                   >
                                                      {isGeneratingRemittance ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-5 h-5 group-hover:translate-y-1 transition-transform" />}
                                                      Arquivo Remessa
                                                   </button>
                                                   <button className="bg-blue-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-blue-900/20">Faturar Mês</button>
                                                </div>
                                             </div>
  
                                             <div className="overflow-x-auto custom-scrollbar relative z-10">
                                                <table className="w-full min-w-[800px]">
                                                   <thead>
                                                      <tr className="border-b border-gray-100">
                                                         <th className="text-left py-5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4">Beneficiário Final</th>
                                                         <th className="text-left py-5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4">Mensalidade</th>
                                                         <th className="text-left py-5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4">Dt. Vencimento</th>
                                                         <th className="text-left py-5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4">Status</th>
                                                         <th className="text-right py-5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4">Ações Financeiras</th>
                                                      </tr>
                                                   </thead>
                                                   <tbody className="divide-y divide-gray-50">
                                                      {allBillings.map((bill, index) => (
                                                         <tr key={`bill-${bill.id || index}-${index}`} className="group hover:bg-gray-50/70 transition-all">
                                                            <td className="py-7 px-4">
                                                               <p className="font-black text-gray-900 text-[14px] italic uppercase tracking-tighter leading-none">{bill.memberName}</p>
                                                               <p className="text-[10px] text-gray-400 font-mono mt-1.5 opacity-60">ID: {String(bill.id).slice(0, 10).toUpperCase()}</p>
                                                            </td>
                                                            <td className="py-7 px-4 font-black text-blue-900 text-[15px] font-mono italic">
                                                               R$ {bill.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="py-7 px-4 text-xs font-black text-gray-500 font-mono">
                                                               {bill.dueDate instanceof Timestamp ? bill.dueDate.toDate().toLocaleDateString('pt-BR') : bill.dueDate}
                                                            </td>
                                                            <td className="py-7 px-4">
                                                               <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                                                                  bill.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                               }`}>
                                                                  {bill.status === 'pending' ? 'AGUARDANDO' : bill.status === 'paid' ? 'LIQUIDADO' : bill.status}
                                                               </span>
                                                            </td>
                                                            <td className="py-7 px-4 text-right">
                                                               <div className="flex items-center justify-end gap-3">
                                                                 <button 
                                                                   onClick={() => {
                                                                     setSelectedBoletoPix({
                                                                       doc: `Mensalidade ${bill.memberName}`,
                                                                       valor: `R$ ${bill.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                                                       id: bill.id
                                                                     });
                                                                     setShowPixModal(true);
                                                                   }}
                                                                   className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-md border border-emerald-100 group/item hover:-translate-y-1"
                                                                   title="Gerar QrCode PIX"
                                                                 >
                                                                    <QrCode className="w-5 h-5" />
                                                                 </button>
                                                                 <button className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-900 hover:text-white transition-all shadow-md border border-gray-100 group/item hover:-translate-y-1" title="Visualizar Boleto PDF">
                                                                    <FileText className="w-5 h-5" />
                                                                 </button>
                                                               </div>
                                                            </td>
                                                         </tr>
                                                      ))}
                                                   </tbody>
                                                </table>
                                             </div>
                                             
                                             <div className="mt-12 p-10 bg-blue-900 rounded-[48px] border border-blue-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-2xl shadow-blue-900/40">
                                                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-[100px]" />
                                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mb-20 blur-[60px]" />
                                                <div className="flex items-center gap-8 relative z-10">
                                                   <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-[32px] shadow-2xl flex items-center justify-center text-white border border-white/20 group-hover:rotate-6 transition-transform duration-500">
                                                      <ShieldCheck className="w-10 h-10 text-amber-400" />
                                                   </div>
                                                   <div>
                                                      <p className="text-xl font-black text-white italic leading-none">Canais de Pagamento Criptografados</p>
                                                      <p className="text-[10px] text-blue-300 font-bold uppercase tracking-[0.4em] mt-2">Segurança Bancária Nível Enterprise / LGPD Compliant</p>
                                                   </div>
                                                </div>
                                                <button className="relative z-10 px-12 py-5 bg-white text-blue-900 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-50 transition-all shadow-2xl hover:scale-105 active:scale-95 duration-300">Configurações Avançadas</button>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'members' && (
                                 <motion.div 
                                   key="members"
                                   initial={{ opacity: 0, x: -20 }} 
                                   animate={{ opacity: 1, x: 0 }} 
                                   exit={{ opacity: 0, x: 20 }}
                                   transition={{ duration: 0.3 }}
                                   className="space-y-8"
                                 >
                             <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                   <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                      <h4 className="text-xl font-bold mb-8 text-blue-900 font-display uppercase tracking-widest text-sm">Logs de Atividade do Sistema</h4>
                                      <div className="space-y-4">
                                         {[
                                           { user: 'empresa@metal.com', action: 'Baixou CCT 2026', time: 'Há 5 min', state: 'PR' },
                                           { user: 'contador@office.com', action: 'Cadastro nova empresa', time: 'Há 12 min', state: 'SP' },
                                           { user: 'rh@indus.com', action: 'Pagamento efetuado', time: 'Há 45 min', state: 'RJ' },
                                           { user: 'diretoria@sind.com', action: 'Nova assembleia criada', time: 'Há 2h', state: 'SC' },
                                         ].map((log, i) => (
                                           <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all cursor-crosshair">
                                              <div className="flex items-center gap-4">
                                                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-black text-xs">
                                                    {log.state}
                                                 </div>
                                                 <div>
                                                    <p className="text-sm font-bold text-gray-800">{log.user}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{log.action}</p>
                                                 </div>
                                              </div>
                                              <span className="text-[10px] font-bold text-gray-400 font-mono">{log.time}</span>
                                           </div>
                                         ))}
                                      </div>
                                   </div>

                                   {isSuperUser && (
                                     <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                       <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-50">
                                         <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                                           <ShieldCheck className="w-6 h-6" />
                                         </div>
                                         <div>
                                           <h4 className="text-xl font-bold text-blue-900 leading-tight">Conselho Administrativo</h4>
                                           <p className="text-xs text-gray-500 font-medium">Controle hierárquico de acesso ao sistema.</p>
                                         </div>
                                       </div>

                                       <form onSubmit={handleAddAdmin} className="flex gap-4 mb-10 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                         <input 
                                           type="email" 
                                           placeholder="E-mail do novo administrador"
                                           value={newAdminEmail}
                                           onChange={(e) => setNewAdminEmail(e.target.value)}
                                           className="flex-1 bg-white border border-gray-200 px-6 py-4 rounded-2xl text-sm focus:outline-none focus:border-blue-900 transition-all font-bold placeholder:text-gray-300"
                                           required
                                         />
                                         <button 
                                           type="submit"
                                           className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 whitespace-nowrap shadow-xl shadow-blue-900/10"
                                         >
                                           <Plus className="w-4 h-4" /> Promover
                                         </button>
                                       </form>

                                       <div className="space-y-3">
                                          {adminList?.map((admin) => (
                                            <div key={admin.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 group hover:border-rose-200 shadow-sm transition-all">
                                              <div className="flex items-center gap-4">
                                                 <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-900 font-black text-xs border border-blue-100">
                                                    {admin.email.charAt(0).toUpperCase()}
                                                 </div>
                                                 <div>
                                                    <p className="text-sm font-black text-gray-800">{admin.email}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">Inscrito em {new Date(admin.createdAt.seconds * 1000).toLocaleDateString()}</p>
                                                 </div>
                                              </div>
                                              <button 
                                                onClick={() => handleRemoveAdmin(admin.email)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                                title="Revogar Acesso"
                                              >
                                                <X className="w-5 h-5" />
                                              </button>
                                            </div>
                                          ))}
                                          {adminList?.length === 0 && (
                                            <div className="text-center py-16 opacity-30">
                                              <ShieldAlert className="w-20 h-20 mx-auto mb-4" />
                                              <p className="text-xs font-black uppercase tracking-widest">Alerta: Nenhuma conta secundária</p>
                                            </div>
                                          )}
                                       </div>
                                     </div>
                                   )}
                                </div>

                                <div className="space-y-8 self-start">
                                   <div className="bg-amber-400 rounded-[40px] p-8 shadow-xl shadow-amber-400/20">
                                      <h5 className="font-black text-blue-950 uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Auditoria de Segurança
                                      </h5>
                                      <p className="text-blue-950/70 text-xs font-bold leading-relaxed mb-6">
                                        Avisos de login suspeitos aparecerão aqui. Mantenha os administradores revisados periodicamente.
                                      </p>
                                      <div className="p-4 bg-white/20 rounded-2xl border border-white/30 text-blue-950 font-bold text-xs">
                                         0 Incidentes nas últimas 24h
                                      </div>
                                   </div>
                                </div>
                             </div>
                           </motion.div>
                         )}

                         {adminSubTab === 'partners' && (
                           <motion.div 
                             key="admin_partners"
                             initial={{ opacity: 0, scale: 0.95 }} 
                             animate={{ opacity: 1, scale: 1 }} 
                             className="space-y-8"
                           >
                              <div className="bg-white border border-gray-100 rounded-[44px] p-8 lg:p-12 shadow-xl">
                                 <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                                   <div>
                                     <h4 className="text-3xl font-bold text-blue-900 font-display">Clube de Vantagens e Convênios</h4>
                                     <p className="text-gray-500 font-medium">Gestão de parceiros que oferecem descontos aos associados.</p>
                                   </div>
                                   <button 
                                     onClick={() => setShowAddPartnerModal(true)}
                                     className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20"
                                   >
                                     <Plus className="w-5 h-5" /> Adicionar Novo Parceiro
                                   </button>
                                 </div>

                                 <div className="grid gap-6">
                                   {partners.map((partner, idx) => (
                                     <div key={`partner-admin-${partner.id || idx}-${idx}`} className="p-8 rounded-[32px] border border-gray-100 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:bg-white hover:shadow-xl transition-all">
                                       <div className="flex items-center gap-6">
                                         <img src={partner.logo} alt={partner.name} className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" referrerPolicy="no-referrer" />
                                         <div>
                                           <h5 className="text-xl font-bold text-blue-950 mb-1">{partner.name}</h5>
                                           {partner.website && (
                                             <a 
                                               href={partner.website} 
                                               target="_blank" 
                                               rel="noopener noreferrer" 
                                               className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5 hover:underline mt-1 mb-1"
                                             >
                                               <Globe className="w-3.5 h-3.5" /> {partner.website}
                                              </a>
                                           )}
                                           <div className="flex items-center gap-4">
                                             <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{partner.category}</span>
                                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 font-mono tracking-tighter">{partner.discount} OFF</span>
                                           </div>
                                         </div>
                                       </div>
                                       <div className="flex items-center gap-3 w-full md:w-auto">
                                         <button 
                                           onClick={() => {
                                             const newDiscount = prompt('Alterar desconto para:', partner.discount);
                                             if (newDiscount) {
                                               setPartners(partners.map(p => p.id === partner.id ? {...p, discount: newDiscount} : p));
                                             }
                                           }}
                                           className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 text-gray-500 rounded-2xl font-bold text-xs hover:text-blue-600 hover:border-blue-200 transition-all font-display"
                                         >
                                           <Settings className="w-4 h-4" /> Editar
                                         </button>
                                         <button 
                                           onClick={() => {
                                             if (confirm(`Remover permanentemente ${partner.name}?`)) {
                                               setPartners(partners.filter(p => p.id !== partner.id));
                                             }
                                           }}
                                           className="p-4 bg-white border border-gray-100 text-rose-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                                         >
                                           <X className="w-5 h-5" />
                                         </button>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                              </div>
                           </motion.div>
                         )}

                         {adminSubTab === 'system' && (
                           <motion.div 
                             key="admin_system"
                             initial={{ opacity: 0, scale: 0.95 }} 
                             animate={{ opacity: 1, scale: 1 }} 
                             className="space-y-8"
                           >
                              <div className="bg-white border border-gray-100 rounded-[44px] p-8 lg:p-12 shadow-xl">
                                 <div className="mb-12">
                                   <h4 className="text-3xl font-bold text-blue-900 font-display">Configurações do Sistema</h4>
                                   <p className="text-gray-500 font-medium">Gerencie o acesso, domínios e conectividade da plataforma.</p>
                                 </div>

                                 <div className="grid lg:grid-cols-2 gap-8">
                                   {/* Domain Card */}
                                   <div className="bg-gray-50/50 border border-gray-100 rounded-[32px] p-8 space-y-6">
                                     <div className="flex items-center gap-4 mb-2">
                                       <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                         <Globe className="w-6 h-6" />
                                       </div>
                                       <div>
                                         <h5 className="font-bold text-blue-950">Domínio Personalizado</h5>
                                         <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">DNS & Acesso Externo</p>
                                       </div>
                                     </div>

                                     <div className="space-y-4">
                                       <div>
                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Domínio Principal</label>
                                         <input 
                                           type="text" 
                                           value={domainConfig.domain}
                                           onChange={(e) => setDomainConfig({...domainConfig, domain: e.target.value})}
                                           className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                           placeholder="exemplo.org.br"
                                         />
                                       </div>
                                       <div>
                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Subdomínio (Portal)</label>
                                         <div className="flex items-center gap-3">
                                           <input 
                                             type="text" 
                                             value={domainConfig.subdomain}
                                             onChange={(e) => setDomainConfig({...domainConfig, subdomain: e.target.value})}
                                             className="flex-1 bg-white border border-gray-200 rounded-2xl px-6 py-4 font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
                                             placeholder="portal"
                                           />
                                           <span className="font-bold text-gray-400">.{domainConfig.domain}</span>
                                         </div>
                                       </div>
                                     </div>

                                     <div className="p-6 bg-white border border-gray-100 rounded-2xl space-y-4">
                                       <div className="flex items-center justify-between text-sm">
                                         <span className="text-gray-500 font-medium italic">Status da Propagação</span>
                                         <span className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">100% Conectado</span>
                                       </div>
                                       <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                         <div className="w-full h-full bg-emerald-500"></div>
                                       </div>
                                     </div>
                                   </div>

                                   {/* SSL & Security */}
                                   <div className="bg-gray-50/50 border border-gray-100 rounded-[32px] p-8 space-y-6">
                                     <div className="flex items-center gap-4 mb-2">
                                       <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                         <ShieldCheck className="w-6 h-6" />
                                       </div>
                                       <div>
                                         <h5 className="font-bold text-blue-950">Segurança & SSL</h5>
                                         <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Certificados & Criptografia</p>
                                       </div>
                                     </div>

                                     <div className="space-y-4">
                                       <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl">
                                         <div className="flex items-center gap-4">
                                           <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                             <Lock className="w-5 h-5" />
                                           </div>
                                           <div>
                                             <p className="font-bold text-gray-900 text-sm">Certificado Let's Encrypt</p>
                                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Renovação Automática Ativa</p>
                                           </div>
                                         </div>
                                         <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-inner"><div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                                       </div>

                                       <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl opacity-60 grayscale cursor-not-allowed">
                                         <div className="flex items-center gap-4">
                                           <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                             <ExternalLink className="w-5 h-5" />
                                           </div>
                                           <div>
                                              <p className="font-bold text-gray-900 text-sm">Redirecionamento HTTP</p>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Sempre forçar HTTPS</p>
                                           </div>
                                         </div>
                                         <div className="w-12 h-6 bg-gray-200 rounded-full relative"><div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div></div>
                                       </div>
                                     </div>

                                     <button 
                                       onClick={() => showNotification('success', 'Configurações de rede salvas com sucesso!')}
                                       className="w-full bg-blue-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20"
                                     >
                                       Aplicar Novas Configurações
                                     </button>
                                   </div>
                                 </div>

                                 {/* Super User Actions */}
                                 {isSuperUser && (
                                   <div className="mt-12 pt-12 border-t border-gray-100">
                                     <div className="flex items-center gap-4 mb-8">
                                       <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                         <ShieldAlert className="w-6 h-6" />
                                       </div>
                                       <div>
                                         <h4 className="text-2xl font-bold text-blue-950">Painel Master (Super Usuário)</h4>
                                         <p className="text-gray-500 font-medium text-sm">Acesso exclusivo para o desenvolvedor e suporte técnico master.</p>
                                       </div>
                                     </div>

                                     <div className="grid lg:grid-cols-2 gap-8">
                                       {/* Register Admins */}
                                       <div className="bg-purple-50/50 border border-purple-100 rounded-[32px] p-8 space-y-6">
                                         <div className="flex items-center justify-between">
                                           <h5 className="font-bold text-purple-900 flex items-center gap-2">
                                             <UserCheck className="w-5 h-5" />
                                             Administradores
                                           </h5>
                                           <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded uppercase">{adminList?.length || 0} Ativos</span>
                                         </div>
                                         
                                         <form onSubmit={handleAddAdmin} className="space-y-4">
                                           <div className="flex gap-2">
                                             <input 
                                               type="email" 
                                               required
                                               value={newAdminEmail}
                                               onChange={(e) => setNewAdminEmail(e.target.value)}
                                               className="flex-1 bg-white border border-purple-200 rounded-2xl px-6 py-4 font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                               placeholder="email@novoadmin.com.br"
                                             />
                                             <button 
                                               type="submit"
                                               className="bg-purple-600 text-white px-6 rounded-2xl font-bold hover:bg-purple-700 transition-all"
                                             >
                                               <Plus className="w-5 h-5" />
                                             </button>
                                           </div>

                                           <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                              {adminList && adminList.length > 0 ? (
                                                adminList.map((admin) => (
                                                  <div key={admin.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-100">
                                                    <span className="text-sm font-bold text-purple-900">{admin.email}</span>
                                                    <button 
                                                      type="button"
                                                      onClick={() => handleRemoveAdmin(admin.email)}
                                                      className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                ))
                                              ) : (
                                                <p className="text-center text-purple-300 text-xs italic py-4">Nenhum administrador cadastrado.</p>
                                              )}
                                           </div>
                                         </form>
                                       </div>

                                       {/* Support & Health */}
                                       <div className="bg-emerald-50/50 border border-emerald-100 rounded-[32px] p-8 space-y-6">
                                         <h5 className="font-bold text-emerald-900 flex items-center gap-2">
                                           <Zap className="w-5 h-5" />
                                           Suporte Técnico & Saúde
                                         </h5>

                                         <div className="space-y-4">
                                           <div className="grid grid-cols-2 gap-4">
                                              <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                                                <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest mb-1">Status API (Gemini)</p>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                  <span className="text-xs font-bold text-emerald-700">Operacional</span>
                                                </div>
                                              </div>
                                              <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                                                <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest mb-1">Firestore DB</p>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                  <span className="text-xs font-bold text-emerald-700">Saudável</span>
                                                </div>
                                              </div>
                                           </div>

                                           <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                                              <h6 className="text-[10px] font-black text-emerald-600 uppercase mb-3">Logs de Atividade</h6>
                                              <div className="space-y-2 font-mono text-[9px] text-emerald-500">
                                                <p className="truncate">[{new Date().toLocaleTimeString()}] Admin Access: {currentUser?.email}</p>
                                                <p className="truncate">[{new Date().toLocaleTimeString()}] Dashboard Heartbeat: OK</p>
                                                <p className="truncate">[{new Date().toLocaleTimeString()}] Iframe Sandbox: Isolated</p>
                                              </div>
                                           </div>

                                           <button 
                                              onClick={() => showNotification('info', 'Iniciando diagnóstico completo...')}
                                              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                           >
                                              Executar Diagnóstico Geral
                                           </button>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 )}
                              </div>
                           </motion.div>
                         )}

                               {adminSubTab === 'team' && (
                                 <motion.div 
                                   key="team"
                                   initial={{ opacity: 0, x: 20 }} 
                                   animate={{ opacity: 1, x: 0 }} 
                                   exit={{ opacity: 0, x: -20 }}
                                   className="space-y-8"
                                 >
                                    <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                       <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-50">
                                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                           <Users className="w-6 h-6" />
                                         </div>
                                         <div>
                                           <h4 className="text-xl font-bold text-blue-900 leading-tight">Liderança & Colaboradores</h4>
                                           <p className="text-xs text-gray-500 font-medium tracking-tight">Gerencie os membros da presidência, diretoria, gerência e atendimento.</p>
                                         </div>
                                       </div>

                                       <div className="flex flex-col xl:flex-row gap-8 mb-10 bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                                         {/* Photo Upload Section */}
                                         <div className="flex flex-col items-center gap-4">
                                           <div className="w-40 h-40 bg-white rounded-[32px] border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                                             {newMemberForm.photo ? (
                                               <img src={newMemberForm.photo} alt="Preview" className="w-full h-full object-cover" />
                                             ) : (
                                               <Camera className="w-10 h-10 text-gray-200" />
                                             )}
                                             <label className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                               <input 
                                                 type="file" 
                                                 className="hidden" 
                                                 onChange={(e) => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                     const url = URL.createObjectURL(file);
                                                     setNewMemberForm({...newMemberForm, photo: url});
                                                   }
                                                 }}
                                               />
                                               <div className="text-center text-white">
                                                 <Upload className="w-6 h-6 mx-auto mb-1" />
                                                 <span className="text-[10px] font-black uppercase tracking-widest">Subir Foto</span>
                                               </div>
                                             </label>
                                           </div>
                                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avatar do Membro</p>
                                         </div>

                                         <div className="flex-1 grid md:grid-cols-2 gap-6">
                                           <div className="space-y-4">
                                             <div>
                                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1 block">Nome do Membro</label>
                                               <input 
                                                 type="text" 
                                                 placeholder="Nome completo"
                                                 value={newMemberForm.name}
                                                 onChange={(e) => setNewMemberForm({...newMemberForm, name: e.target.value})}
                                                 className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl text-sm focus:outline-none focus:border-blue-900 transition-all font-bold"
                                               />
                                             </div>
                                             <div>
                                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1 block">Cargo / Função</label>
                                               <input 
                                                 type="text" 
                                                 placeholder="Ex: Diretor Financeiro"
                                                 value={newMemberForm.role}
                                                 onChange={(e) => setNewMemberForm({...newMemberForm, role: e.target.value})}
                                                 className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl text-sm focus:outline-none focus:border-blue-900 transition-all font-bold"
                                               />
                                             </div>
                                           </div>
                                           <div className="space-y-4">
                                             <div>
                                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1 block">Categoria</label>
                                               <select 
                                                 value={newMemberForm.category}
                                                 onChange={(e) => setNewMemberForm({...newMemberForm, category: e.target.value as any})}
                                                 className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl text-sm focus:outline-none focus:border-blue-900 transition-all font-bold appearance-none cursor-pointer"
                                               >
                                                 <option value="presidencia">Presidência</option>
                                                 <option value="diretoria">Diretoria</option>
                                                 <option value="gerencia">Gerência</option>
                                                 <option value="atendimento">Atendimento</option>
                                               </select>
                                             </div>
                                             <button 
                                               onClick={() => {
                                                 if (!newMemberForm.name || !newMemberForm.role) {
                                                   alert("Preencha nome e cargo.");
                                                   return;
                                                 }
                                                 const member: TeamMember = {
                                                   id: Math.random().toString(36).substr(2, 9),
                                                   ...newMemberForm
                                                 };
                                                 setTeamMembers([...teamMembers, member]);
                                                 setNewMemberForm({ name: '', role: '', category: member.category, photo: '' });
                                               }}
                                               className="w-full h-[60px] bg-blue-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-950/20 flex items-center justify-center gap-2 mt-auto"
                                             >
                                               <Plus className="w-5 h-5 text-amber-400" /> Cadastrar Novo Membro
                                             </button>
                                           </div>
                                         </div>
                                       </div>

                                       <div className="grid md:grid-cols-2 gap-8">
                                          {['presidencia', 'diretoria', 'gerencia', 'atendimento'].map((cat) => (
                                            <div key={cat} className="space-y-4">
                                              <h5 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] px-4 flex items-center gap-3">
                                                <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                                                {cat === 'presidencia' ? 'Presidência' : cat === 'diretoria' ? 'Diretoria' : cat === 'gerencia' ? 'Gerência' : 'Atendimento'}
                                              </h5>
                                              <div className="space-y-3">
                                                {teamMembers.filter(m => m.category === cat).map((member) => (
                                                  <div key={member.id} className="flex flex-col gap-4 p-4 bg-white border border-gray-100 rounded-2xl group hover:border-blue-200 transition-all cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-inner flex items-center justify-center overflow-hidden border border-gray-100 p-0.5">
                                                          {member.photo ? (
                                                            <img src={member.photo} alt={member.name} className="w-full h-full object-cover rounded-[14px]" />
                                                          ) : (
                                                            <Users className="w-5 h-5 text-blue-200" />
                                                          )}
                                                        </div>
                                                        <div>
                                                          <p className="text-sm font-black text-blue-950 leading-tight">{member.name}</p>
                                                          <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{member.role}</p>
                                                            <button 
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newRole = prompt("Editar cargo de " + member.name, member.role);
                                                                if (newRole !== null && newRole.trim() !== '') {
                                                                  setTeamMembers(teamMembers.map(m => m.id === member.id ? { ...m, role: newRole } : m));
                                                                }
                                                              }}
                                                              className="p-1 hover:bg-gray-100 rounded text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                                              title="Editar Cargo"
                                                            >
                                                              <Pencil className="w-3 h-3" />
                                                            </button>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Ativo</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button 
                                                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-900 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
                                                          title="Visualizar Detalhes"
                                                        >
                                                          <Eye className="w-3.5 h-3.5" />
                                                          <span className="hidden sm:inline">Ver</span>
                                                        </button>
                                                        <button 
                                                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
                                                          title="Editar Perfil"
                                                        >
                                                          <Settings className="w-3.5 h-3.5" />
                                                          <span className="hidden sm:inline">Editar</span>
                                                        </button>
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTeamMembers(teamMembers.filter(m => m.id !== member.id));
                                                          }}
                                                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                          title="Remover"
                                                        >
                                                          <X className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                                {teamMembers.filter(m => m.category === cat).length === 0 && (
                                                  <div className="flex items-center justify-center py-8 bg-gray-50/50 rounded-[28px] border border-dashed border-gray-200">
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest opacity-40">Sem cadastros</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                       </div>
                                    </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'publications' && (
                                 <motion.div 
                                   key="publications"
                                   initial={{ opacity: 0, y: 20 }} 
                                   animate={{ opacity: 1, y: 0 }} 
                                   exit={{ opacity: 0, y: -20 }}
                                   className="space-y-8"
                                 >
                                    <div className="grid lg:grid-cols-2 gap-8">
                                       <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                          <div className="flex items-center gap-4 mb-8">
                                             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                                <FileText className="w-6 h-6" />
                                             </div>
                                             <div>
                                                <h4 className="text-xl font-bold text-blue-900">Upload de Documentos</h4>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                                   CCT, Notícias e Editais Jurídicos
                                                   <span className="block text-[8px] text-amber-500 mt-0.5">* Acesso permitido para Administradores e Gerente Geral</span>
                                                </p>
                                             </div>
                                          </div>

                                          <div className="space-y-4">
                                             <div className="border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center hover:border-blue-300 transition-all cursor-pointer bg-gray-50/50 group">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                                   <Upload className="w-8 h-8 text-blue-300" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-600 mb-1">Arraste seus documentos aqui</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF, DOCX até 50MB</p>
                                             </div>
                                             
                                             <div className="grid grid-cols-4 gap-2">
                                                {[
                                                  { label: 'CCT', val: 'cct' },
                                                  { label: 'Notícia', val: 'news' },
                                                  { label: 'Edital', val: 'internal' },
                                                  { label: 'Jurídico', val: 'juridico' }
                                                ].map((t) => (
                                                   <button 
                                                     key={t.val} 
                                                     onClick={() => setDocType(t.val as any)}
                                                     className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                       docType === t.val
                                                       ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20' 
                                                       : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                                                     }`}
                                                   >
                                                      {t.label}
                                                   </button>
                                                ))}
                                             </div>
                                             
                                             <button 
                                               onClick={handlePublishDoc}
                                               disabled={isUploadingDoc}
                                               className="w-full bg-blue-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-950/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                             >
                                                {isUploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar no Portal'}
                                             </button>
                                          </div>
                                       </div>

                                       <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl">
                                          <h4 className="text-xl font-bold mb-8 text-blue-900 font-display uppercase tracking-widest text-xs">Publicações Ativas</h4>
                                          <div className="space-y-4">
                                             {[
                                               { title: 'CCT 2026/2027 - Setor Metalúrgico', type: 'CCT', date: 'Hoje, 10:45', desc: 'Convenção Coletiva de Trabalho completa contendo os novos pisos salariais e cláusulas sociais aprovadas em assembleia.' },
                                               { title: 'Link do Diário Oficial', type: 'Link', date: 'Ontem', desc: 'Acesse a publicação oficial no Diário Oficial da União.', isExternal: true, url: 'https://dou.gov.br' },
                                               { title: 'Edital de Convocação - Assembleia Geral', type: 'Edital', date: '12/05/2026', desc: 'Edital oficial convocando todos os associados para a Assembleia Geral Extraordinária sobre o plano de saúde.' },
                                             ].map((pub, i) => (
                                               <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden group hover:bg-white hover:border-blue-200 transition-all">
                                                  <div className="p-4 flex items-center justify-between">
                                                     <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                           {pub.isExternal ? <Globe className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                                                        </div>
                                                        <div>
                                                           <p className="text-xs font-bold text-gray-800 line-clamp-1 flex items-center gap-1.5">
                                                              {pub.title}
                                                              {pub.isExternal && <ExternalLink className="w-3 h-3 text-gray-400" />}
                                                            </p>
                                                           <div className="flex items-center gap-2">
                                                              <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">{pub.type}</span>
                                                              <span className="text-[9px] text-gray-400 font-bold">{pub.date}</span>
                                                           </div>
                                                        </div>
                                                     </div>
                                                     <div className="flex items-center gap-2">
                                                        {pub.isExternal && (
                                                           <button 
                                                             className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                             title="Baixar em PDF"
                                                             onClick={(e) => { e.stopPropagation(); alert('Baixando PDF...'); }}
                                                           >
                                                              <Download className="w-3.5 h-3.5" />
                                                              <span>PDF</span>
                                                           </button>
                                                        )}
                                                        <button 
                                                          onClick={() => {
                                                             if (pub.isExternal && pub.url) {
                                                               window.open(pub.url, '_blank');
                                                             } else {
                                                               setExpandedPubIndex(expandedPubIndex === i ? null : i);
                                                             }
                                                           }}
                                                          className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                                        >
                                                           {pub.isExternal ? (
                                                              <>Link Externo <ExternalLink className="w-3 h-3" /></>
                                                            ) : (
                                                              expandedPubIndex === i ? 'Recolher' : 'Ver Detalhes'
                                                            )}
                                                        </button>
                                                        <button className="p-2 text-gray-300 hover:text-blue-600">
                                                           <Eye className="w-4 h-4" />
                                                        </button>
                                                     </div>
                                                  </div>
                                                  
                                                  <AnimatePresence>
                                                     {expandedPubIndex === i && (
                                                        <motion.div
                                                          initial={{ height: 0, opacity: 0 }}
                                                          animate={{ height: 'auto', opacity: 1 }}
                                                          exit={{ height: 0, opacity: 0 }}
                                                          className="px-4 pb-4 border-t border-gray-100 bg-white/50"
                                                        >
                                                           <div className="pt-4 space-y-3">
                                                              <p className="text-xs text-gray-500 font-medium leading-relaxed">{pub.desc}</p>
                                                              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                                                                 <Clock className="w-3 h-3 text-gray-400" />
                                                                 <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Publicado em: {pub.date}</span>
                                                              </div>
                                                           </div>
                                                        </motion.div>
                                                     )}
                                        </AnimatePresence>
                                               </div>
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'cms' && (
                                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-10 space-y-10">
                                    <div className="flex items-center justify-between">
                                       <div>
                                          <h3 className="text-3xl font-black text-blue-900 tracking-tighter">Editor do Portal</h3>
                                          <p className="text-sm text-gray-500 font-medium">Personalize a experiência visual e textual do site.</p>
                                       </div>
                                       <button 
                                         onClick={() => showNotification('success', 'Alterações do site publicadas com sucesso!')}
                                         className="bg-emerald-500 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
                                       >
                                          <CheckCircle2 className="w-5 h-5" /> Publicar Site
                                       </button>
                                    </div>

                                    <div className="grid lg:grid-cols-2 gap-10">
                                       {/* Identidade Visual */}
                                       <div className="col-span-2 bg-white border border-gray-100 rounded-[44px] p-8 lg:p-12 shadow-xl space-y-10">
                                             <div className="flex items-center gap-6 border-b border-gray-50 pb-8">
                                               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                                                 <ImageIcon className="w-8 h-8" />
                                               </div>
                                               <div>
                                                 <h4 className="text-2xl font-black text-blue-950 font-display">Identidade Visual</h4>
                                                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mt-2">Logomarca do Sindicato</p>
                                               </div>
                                             </div>

                                             <div className="grid lg:grid-cols-2 gap-12">
                                               <div className="space-y-8">
                                                 <div className="space-y-4">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Upload do Logo (PNG de preferência)</label>
                                                   <div className="relative group">
                                                     <input 
                                                       type="text" 
                                                       placeholder="URL do Logo ou Cole o Link"
                                                       value={siteConfig.logoUrl}
                                                       onChange={(e) => setSiteConfig({...siteConfig, logoUrl: e.target.value})}
                                                       className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:bg-white focus:border-blue-900 transition-all outline-none text-sm pr-16"
                                                     />
                                                     <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                       <input 
                                                         type="file" 
                                                         id="logo-upload" 
                                                         className="hidden" 
                                                         accept="image/*"
                                                         onChange={(e) => {
                                                           const file = e.target.files?.[0];
                                                           if (file) {
                                                             const reader = new FileReader();
                                                             reader.onloadend = () => {
                                                               setSiteConfig({...siteConfig, logoUrl: reader.result as string});
                                                             };
                                                             reader.readAsDataURL(file);
                                                           }
                                                         }}
                                                       />
                                                       <label htmlFor="logo-upload" className="p-3 bg-white shadow-lg rounded-xl cursor-pointer hover:bg-gray-50 transition-all block">
                                                         <Upload className="w-4 h-4 text-blue-600" />
                                                       </label>
                                                     </div>
                                                   </div>
                                                   <p className="text-[10px] text-gray-400 font-bold px-4">Recomendado: Logo com fundo transparente (PNG/SVG).</p>
                                                 </div>

                                                 <div className="grid grid-cols-2 gap-6">
                                                   <div className="space-y-4">
                                                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Largura Header (px)</label>
                                                     <input 
                                                       type="range"
                                                       min="50"
                                                       max="300"
                                                       value={siteConfig.headerLogoWidth || 100}
                                                       onChange={(e) => setSiteConfig({...siteConfig, headerLogoWidth: parseInt(e.target.value)})}
                                                       className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                                                     />
                                                     <div className="flex justify-between text-[10px] font-black text-gray-400 px-4 uppercase">
                                                       <span>50px</span>
                                                       <span className="text-blue-600">{siteConfig.headerLogoWidth}px</span>
                                                       <span>300px</span>
                                                     </div>
                                                   </div>
                                                   <div className="space-y-4">
                                                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Largura Footer (px)</label>
                                                     <input 
                                                       type="range"
                                                       min="40"
                                                       max="250"
                                                       value={siteConfig.footerLogoWidth || 80}
                                                       onChange={(e) => setSiteConfig({...siteConfig, footerLogoWidth: parseInt(e.target.value)})}
                                                       className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                                                     />
                                                     <div className="flex justify-between text-[10px] font-black text-gray-400 px-4 uppercase">
                                                       <span>40px</span>
                                                       <span className="text-blue-600">{siteConfig.footerLogoWidth}px</span>
                                                       <span>250px</span>
                                                     </div>
                                                   </div>
                                                 </div>
                                               </div>

                                               <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 flex flex-col items-center justify-center space-y-6 text-center">
                                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pré-visualização do Logo</span>
                                                  <div className="bg-white p-6 rounded-[24px] shadow-2xl shadow-blue-900/5 min-h-[120px] flex items-center justify-center">
                                                     {siteConfig.logoUrl ? (
                                                       <img src={siteConfig.logoUrl} style={{ width: `${siteConfig.headerLogoWidth}px` }} className="h-auto" alt="Preview" />
                                                     ) : (
                                                       <div className="text-gray-200 flex flex-col items-center gap-2">
                                                         <ImageIcon className="w-12 h-12" />
                                                         <span className="text-[10px] font-black uppercase">Nenhum logo</span>
                                                       </div>
                                                     )}
                                                  </div>
                                                  <div className="text-center">
                                                    <p className="text-[#1a3673] font-black text-xs uppercase tracking-tight">Cabeçalho Institucional</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Simulação de fundo branco</p>
                                                  </div>
                                               </div>
                                             </div>
                                       </div>

                                       <div className="space-y-10">
                                          <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl space-y-8">
                                             <h4 className="text-xl font-bold text-blue-900 border-b border-gray-50 pb-6 flex items-center gap-3">
                                                <Home className="w-6 h-6 text-amber-500" /> Hero Section (Principal)
                                             </h4>
                                             <div className="space-y-6">
                                                <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Banner Título</label>
                                                   <input 
                                                      type="text" 
                                                      value={siteConfig.heroTitle}
                                                      onChange={(e) => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
                                                      className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:bg-white focus:border-blue-900 transition-all outline-none text-sm"
                                                   />
                                                </div>
                                                <div className="space-y-2">
                                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Banner Descrição</label>
                                                   <textarea 
                                                      rows={4}
                                                      value={siteConfig.heroSubtitle}
                                                      onChange={(e) => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})}
                                                      className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl font-bold focus:bg-white focus:border-blue-900 transition-all outline-none text-sm leading-relaxed"
                                                   />
                                                </div>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="bg-blue-950 rounded-[48px] p-12 text-white shadow-3xl shadow-blue-950/40 relative overflow-hidden flex flex-col justify-center">
                                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                                          <div className="relative z-10 space-y-10">
                                             <div className="space-y-4">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Pré-visualização Mobile</span>
                                                <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/10 space-y-6">
                                                   <h2 className="text-3xl font-black leading-tight border-l-4 border-amber-400 pl-4">
                                                      {siteConfig.heroTitle}
                                                   </h2>
                                                   <p className="text-sm text-blue-200/60 leading-relaxed">
                                                      {siteConfig.heroSubtitle}
                                                   </p>
                                                   <div className="flex gap-3">
                                                      <div className="w-10 h-10 rounded-xl bg-amber-400"></div>
                                                      <div className="flex-1 h-10 rounded-xl bg-white/10 border border-white/20"></div>
                                                   </div>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'juceb' && (
                                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-10 space-y-10">
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-6">
                                          <div className="w-16 h-16 bg-white rounded-[24px] shadow-xl flex items-center justify-center p-3 border border-gray-50">
                                             <img src="https://www.google.com/s2/favicons?domain=juceb.ba.gov.br&sz=128" className="w-full h-full object-contain" alt="JUCEB" />
                                          </div>
                                          <div>
                                             <h3 className="text-3xl font-black text-blue-900 tracking-tighter">Convênio JUCEB</h3>
                                             <p className="text-sm text-gray-500 font-medium tracking-tight">Atendimento presencial e suporte à formalização empresarial.</p>
                                          </div>
                                       </div>
                                       <div className="flex gap-4">
                                          <button className="bg-blue-50 text-blue-900 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2">
                                             <Users className="w-5 h-5" /> Atendentes
                                          </button>
                                          <button className="bg-blue-900 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-105 transition-all flex items-center gap-2">
                                             <Plus className="w-5 h-5" /> Agendar Atendimento
                                          </button>
                                       </div>
                                    </div>

                                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-blue-900/5 overflow-hidden">
                                       <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                          <h4 className="font-bold text-gray-800 text-lg">Processos em Tramitação</h4>
                                          <div className="flex gap-3">
                                             <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">5 Ativos</span>
                                             <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">2 Pendentes</span>
                                          </div>
                                       </div>
                                       <div className="overflow-x-auto">
                                          <table className="w-full">
                                             <thead className="bg-gray-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                <tr>
                                                   <th className="px-10 py-6 text-left">Empresa / CNPJ</th>
                                                   <th className="px-10 py-6 text-left">Protocolo / Tipo</th>
                                                   <th className="px-10 py-6 text-left">Status Atual</th>
                                                   <th className="px-10 py-6 text-left">Atendente</th>
                                                   <th className="px-10 py-6 text-right">Ações</th>
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-50">
                                                {jucebProcesses.map((proc, idx) => (
                                                   <tr key={`proc-${proc.id || idx}-${idx}`} className="hover:bg-blue-50/30 transition-all group">
                                                      <td className="px-10 py-8">
                                                         <p className="text-sm font-bold text-gray-800 group-hover:text-blue-900">{proc.company}</p>
                                                         <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Entrada: {proc.date}</p>
                                                      </td>
                                                      <td className="px-10 py-8">
                                                         <p className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block">{proc.type}</p>
                                                      </td>
                                                      <td className="px-10 py-8">
                                                         <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                              proc.status === 'Concluído' ? 'bg-emerald-500' :
                                                              proc.status === 'Em Análise' ? 'bg-blue-500' :
                                                              'bg-amber-500'
                                                            } ring-4 ${
                                                              proc.status === 'Concluído' ? 'ring-emerald-50' :
                                                              proc.status === 'Em Análise' ? 'ring-blue-50' :
                                                              'ring-amber-50'
                                                            }`}></div>
                                                            <span className="text-sm font-bold text-gray-800">{proc.status}</span>
                                                         </div>
                                                      </td>
                                                      <td className="px-10 py-8">
                                                         <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-900">AF</div>
                                                            <span className="text-xs font-bold text-gray-500">{proc.responsible}</span>
                                                         </div>
                                                      </td>
                                                      <td className="px-10 py-8 text-right">
                                                         <div className="flex items-center justify-end gap-3">
                                                            <button className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-blue-900 transition-all border border-gray-100 hover:border-blue-200"><Eye className="w-5 h-5" /></button>
                                                            <button className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-blue-900 transition-all border border-gray-100 hover:border-blue-200"><MessageSquare className="w-5 h-5" /></button>
                                                         </div>
                                                      </td>
                                                   </tr>
                                                ))}
                                             </tbody>
                                          </table>
                                       </div>
                                    </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'ai_faq' && (
                                 <motion.div 
                                   key="ai_faq"
                                   initial={{ opacity: 0, y: 20 }} 
                                   animate={{ opacity: 1, y: 0 }} 
                                   className="space-y-8"
                                 >
                                    <div className="bg-white border border-gray-100 rounded-[44px] p-10 lg:p-12 shadow-xl">
                                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                         <div className="flex items-center gap-6">
                                           <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
                                             <Bot className="w-8 h-8" />
                                           </div>
                                           <div>
                                             <h4 className="text-3xl font-black text-blue-950 font-display">Gerador de FAQ Inteligente</h4>
                                             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mt-2">IA + Feedback de Usuário</p>
                                           </div>
                                         </div>
                                         <button 
                                           onClick={handleGenerateFAQ}
                                           disabled={isGeneratingFAQ}
                                           className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3"
                                         >
                                           {isGeneratingFAQ ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                           {isGeneratingFAQ ? 'Analisando Sugestões...' : 'Gerar Novo FAQ com IA'}
                                         </button>
                                       </div>

                                       <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 mb-12 flex items-start gap-4">
                                          <HelpCircle className="w-6 h-6 text-amber-500 shrink-0" />
                                          <div>
                                            <h5 className="font-bold text-amber-900 mb-1">Como funciona?</h5>
                                            <p className="text-sm text-amber-700/80 leading-relaxed font-medium">
                                              Nossa IA analisa todas as mensagens enviadas através do formulário de sugestões e do chat jurídico. 
                                              Ela identifica padrões, agrupa por categorias e redige respostas profissionais baseadas na CCT. 
                                            </p>
                                          </div>
                                       </div>

                                       <div className="space-y-6">
                                          <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">FAQ Atualmente Público ({faqs.length})</h5>
                                          <div className="grid gap-4">
                                            {faqs.map((item, idx) => (
                                              <div key={idx} className="p-8 bg-gray-50 border border-gray-100 rounded-[32px] hover:border-indigo-200 hover:bg-white transition-all shadow-sm">
                                                <div className="flex items-center gap-3 mb-4">
                                                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-wider">{item.category}</span>
                                                  <span className="text-[10px] font-bold text-gray-400">Relevância: {item.relevance}/10</span>
                                                </div>
                                                <h5 className="text-xl font-bold text-blue-950 mb-3">{item.question}</h5>
                                                <p className="text-gray-600 leading-relaxed font-medium">{item.answer}</p>
                                              </div>
                                            ))}
                                            {faqs.length === 0 && (
                                              <div className="text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                                                <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhum FAQ gerado ainda.</p>
                                              </div>
                                            )}
                                          </div>
                                       </div>
                                    </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'associates' && (
                                 <motion.div 
                                   key="associates"
                                   initial={{ opacity: 0, x: -20 }} 
                                   animate={{ opacity: 1, x: 0 }} 
                                   exit={{ opacity: 0, x: 20 }}
                                   className="space-y-8"
                                 >
                                   {/* SOLICITAÇÕES PENDENTES */}
                                   {membershipRequests.length > 0 && (
                                     <div className="bg-amber-50 border border-amber-100 rounded-[40px] p-8 lg:p-10 shadow-xl overflow-hidden relative">
                                        <div className="flex items-center gap-4 mb-8">
                                          <div className="w-12 h-12 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20">
                                            <Users className="w-6 h-6" />
                                          </div>
                                          <div>
                                            <h4 className="text-xl font-black text-blue-900 leading-tight">Solicitações de Filiação ({membershipRequests.length})</h4>
                                            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-none mt-1">Aprovação gera 12 mensalidades automaticamente</p>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          {membershipRequests.map((req) => (
                                            <div key={req.id} className="bg-white p-6 rounded-3xl border border-amber-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-lg transition-all group">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                  <h5 className="font-black text-blue-950 group-hover:text-blue-600 transition-all">{req.companyName}</h5>
                                                  <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{req.cnpj}</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold text-gray-500">
                                                  <div className="flex items-center gap-2 text-blue-900/60"><Send className="w-3 h-3" /> {req.email}</div>
                                                  <div className="flex items-center gap-2 text-blue-900/60"><Phone className="w-3 h-3" /> {req.phone}</div>
                                                  <div className="flex items-center gap-2 text-blue-900/60"><Briefcase className="w-3 h-3" /> {req.representative}</div>
                                                  <div className="flex items-center gap-2 text-blue-900/60"><Building2 className="w-3 h-3" /> R$ {Number(req.capitalSocial).toLocaleString('pt-BR')}</div>
                                                </div>
                                              </div>
                                              <button 
                                                onClick={() => handleApproveRequest(req)}
                                                className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
                                              >
                                                <CheckCircle2 className="w-4 h-4" /> Aprovar e Gerar Cobranças
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                     </div>
                                   )}
                                    <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl overflow-hidden relative">
                                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                          <div>
                                             <h4 className="text-2xl font-black text-blue-900 leading-tight">Painel de Associados</h4>
                                             <p className="text-sm text-gray-400 font-bold">Gerencie perfis e visualize dados de cada associado.</p>
                                          </div>
                                          <div className="flex gap-2">
                                             <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input 
                                                  type="text" 
                                                  placeholder="Buscar associado..."
                                                  className="bg-gray-100 border-none px-12 py-3 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-900/10 transition-all outline-none w-64"
                                                />
                                             </div>
                                          </div>
                                       </div>

                                       <div className="overflow-x-auto">
                                          <table className="w-full text-left">
                                             <thead>
                                                <tr className="border-b border-gray-50">
                                                   <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Associado</th>
                                                   <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest hidden md:table-cell">CNPJ</th>
                                                   <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Nível</th>
                                                   <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                                                   <th className="pb-6 text-right text-[10px] font-black text-gray-300 uppercase tracking-widest">Ações</th>
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-50">
                                                {[
                                                  { name: 'Transportes Rápidos Ltda', cnpj: '12.345.678/0001-90', level: 'Ouro', status: 'Ativo' },
                                                  { name: 'Indústrias Metalúrgicas ABC', cnpj: '98.765.432/0001-10', level: 'Prata', status: 'Ativo' },
                                                  { name: 'Comércio de Ferragens Silva', cnpj: '45.678.901/0001-22', level: 'Bronze', status: 'Inativo' },
                                                  { name: 'Logística Expressa Global', cnpj: '00.111.222/0001-33', level: 'Diamante', status: 'Ativo' },
                                                ].map((company, i) => (
                                                  <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                                     <td className="py-6">
                                                        <div className="flex items-center gap-4">
                                                           <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-900 font-black text-[10px]">
                                                              {company.name.charAt(0)}
                                                           </div>
                                                           <p className="text-sm font-bold text-gray-800">{company.name}</p>
                                                        </div>
                                                     </td>
                                                     <td className="py-6 hidden md:table-cell">
                                                        <p className="text-xs font-mono text-gray-400">{company.cnpj}</p>
                                                     </td>
                                                     <td className="py-6">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                                          company.level === 'Diamante' ? 'bg-indigo-50 text-indigo-600' :
                                                          company.level === 'Ouro' ? 'bg-amber-50 text-amber-600' :
                                                          'bg-gray-100 text-gray-500'
                                                        }`}>
                                                           {company.level}
                                                        </span>
                                                     </td>
                                                     <td className="py-6">
                                                        <div className="flex items-center gap-1.5">
                                                           <div className={`w-1.5 h-1.5 rounded-full ${company.status === 'Ativo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                           <span className="text-[10px] font-bold text-gray-600">{company.status}</span>
                                                        </div>
                                                     </td>
                                                     <td className="py-6 text-right">
                                                        <button 
                                                          onClick={() => setSelectedAssociate(company)}
                                                          className="px-4 py-2 bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-900/10 active:scale-95"
                                                        >
                                                           Acessar Perfil
                                                        </button>
                                                     </td>
                                                  </tr>
                                                ))}
                                             </tbody>
                                          </table>
                                       </div>
                                    </div>
                                 </motion.div>
                               )}

                               {adminSubTab === 'docs' && (
                                 <motion.div 
                                   key="docs"
                                   initial={{ opacity: 0, y: 30 }} 
                                   animate={{ opacity: 1, y: 0 }} 
                                   exit={{ opacity: 0, y: -30 }}
                                   transition={{ duration: 0.3 }}
                                   className="max-w-4xl mx-auto"
                                 >
                              <div className="bg-white border border-gray-100 rounded-[40px] p-12 shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-6 mb-12 pb-6 border-b border-gray-50">
                                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                                    <FileCheck className="w-8 h-8" />
                                  </div>
                                  <div>
                                    <h4 className="text-2xl font-black text-blue-950 font-display">Emissor de Documentos</h4>
                                    <p className="text-sm font-bold text-gray-400">Fila de Pedidos e Geração de Documentos Oficiais.</p>
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-12">
                                  <div className="space-y-8">
                                    <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
                                        <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] mb-6 block px-2">1. Identidade Visual</label>
                                        <div className="relative group">
                                           {isUploading ? (
                                              <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 p-10 rounded-[32px] text-center min-h-[224px] flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                                                  <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                  >
                                                    <Loader2 className="w-8 h-8 text-blue-600" />
                                                  </motion.div>
                                                </div>
                                                <p className="text-sm font-black text-blue-900 mb-4 uppercase tracking-widest leading-none">Enviando Logotipo...</p>
                                                <div className="w-full max-w-[160px] mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                   <motion.div 
                                                     className="h-full bg-blue-600"
                                                     initial={{ width: 0 }}
                                                     animate={{ width: `${uploadProgress}%` }}
                                                   />
                                                </div>
                                                <p className="text-[10px] font-bold text-blue-400 mt-2 font-mono">{Math.round(uploadProgress)}%</p>
                                              </div>
                                            ) : !adminLogo ? (
                                              <label className="block cursor-pointer">
                                                 <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 p-10 rounded-[32px] text-center transition-all bg-gray-50/30 relative overflow-hidden group">
                                                    <div className="relative z-10">
                                                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                                                          <ImageIcon className="w-8 h-8 text-blue-600" />
                                                       </div>
                                                       <p className="text-sm font-black text-gray-900 mb-1">Subir Logotipo</p>
                                                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-2">Escolha um arquivo PNG ou SVG</p>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                                 </div>
                                              </label>
                                           ) : (
                                              <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="relative bg-white border border-gray-100 p-10 rounded-[32px] shadow-xl shadow-blue-900/5 flex flex-col items-center justify-center min-h-[220px] overflow-hidden"
                                              >
                                                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent)] pointer-events-none" />
                                                 <div className="relative z-10">
                                                    <div className="relative group/logo p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                       <img src={adminLogo} className="max-h-24 w-auto object-contain drop-shadow-2xl" alt="Prévia do Logo" />
                                                       <button 
                                                         onClick={() => setAdminLogo(null)}
                                                         className="absolute -top-3 -right-3 bg-white text-rose-500 p-2 rounded-xl shadow-xl hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110 border border-gray-100"
                                                       >
                                                          <X className="w-4 h-4" />
                                                       </button>
                                                    </div>
                                                    <div className="mt-8 flex flex-col items-center">
                                                       <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 mb-2">
                                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.1em]">Logo Ativo e Pronto</span>
                                                       </div>
                                                       <p className="text-[10px] font-bold text-gray-300 italic">Este logo aparecerá no cabeçalho do PDF</p>
                                                    </div>
                                                 </div>
                                              </motion.div>
                                           )}
                                           {uploadStatus && (
                                              <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`mt-4 p-4 rounded-2xl border flex items-center gap-3 ${
                                                  uploadStatus.type === 'success' 
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                                    : 'bg-rose-50 border-rose-100 text-rose-700'
                                                }`}
                                              >
                                                {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                                <span className="text-[10px] font-black uppercase tracking-wider">{uploadStatus.message}</span>
                                              </motion.div>
                                           )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-blue-900 rounded-[32px] text-white shadow-xl shadow-blue-900/20">
                                       <h5 className="font-bold text-sm mb-2">Dica Pro</h5>
                                       <p className="text-blue-200 text-xs font-medium leading-relaxed">
                                         Utilize logotipos em formato PNG com fundo transparente para melhor qualidade técnica no PDF final.
                                       </p>
                                    </div>
                                  </div>

                                  <div className="space-y-6">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">2. Dados do Destinatário</label>
                                     <div className="space-y-4">
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-bold text-gray-400 px-4">Nome da Empresa</p>
                                          <input 
                                             type="text" 
                                             placeholder="Ex: Indústrias Metalúrgicas"
                                             value={certForm.companyName}
                                             onChange={(e) => setCertForm({...certForm, companyName: e.target.value})}
                                             className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-900 outline-none transition-all shadow-sm"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-bold text-gray-400 px-4">CNPJ</p>
                                          <input 
                                             type="text" 
                                             placeholder="00.000.000/0001-00"
                                             value={certForm.cnpj}
                                             onChange={(e) => setCertForm({...certForm, cnpj: e.target.value})}
                                             className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-900 outline-none transition-all shadow-sm"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-bold text-gray-400 px-4">Validade</p>
                                          <select 
                                             value={certForm.validity}
                                             onChange={(e) => setCertForm({...certForm, validity: e.target.value})}
                                             className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-900 outline-none transition-all shadow-sm cursor-pointer"
                                          >
                                             <option value="30 dias">30 dias corridos</option>
                                             <option value="60 dias">60 dias corridos</option>
                                             <option value="90 dias">90 dias corridos</option>
                                             <option value="180 dias">180 dias corridos</option>
                                          </select>
                                        </div>
                                     </div>

                                     <div className="grid grid-cols-2 gap-4 pt-6">
                                        <button 
                                           onClick={() => generatePDF('certidao')}
                                           disabled={isGeneratingCert}
                                           className="bg-blue-900 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex flex-col items-center justify-center gap-2 shadow-2xl shadow-blue-900/10 active:scale-95 disabled:opacity-50"
                                        >
                                           <Printer className="w-5 h-5" /> 
                                           <span>Gerar Certidão</span>
                                        </button>
                                        <button 
                                           onClick={() => generatePDF('regularidade')}
                                           disabled={isGeneratingCert}
                                           className="bg-emerald-500 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex flex-col items-center justify-center gap-2 shadow-2xl shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
                                        >
                                           <CheckCircle className="w-5 h-5" /> 
                                           <span>Regularidade</span>
                                        </button>
                                     </div>
                                  </div>
                                </div>
                             </div>
                          </motion.div>
                                )}
                             </AnimatePresence>
                          </div>
                       </motion.div>
                     ) : (
                       <motion.div 
                        key="settings"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl bg-white border border-gray-100 rounded-[40px] p-12 shadow-xl"
                      >
                        <h3 className="text-3xl font-bold mb-8 font-display">Configurações da Conta</h3>
                        <div className="space-y-8">
                            <div className="p-8 bg-gray-50 rounded-3xl space-y-6">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Nome de Exibição</label>
                                  <input 
                                    type="text"
                                    value={newDisplayName}
                                    onChange={(e) => setNewDisplayName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:border-blue-900 outline-none transition-all shadow-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">URL da Foto de Perfil</label>
                                  <input 
                                    type="text"
                                    value={newPhotoURL}
                                    onChange={(e) => setNewPhotoURL(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:border-blue-900 outline-none transition-all shadow-sm"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pb-6 border-b border-gray-200 mt-6">
                                <div>
                                    <p className="font-bold text-gray-900">Notificações por E-mail</p>
                                    <p className="text-xs text-gray-500">Receba alertas de vencimentos e assembleias.</p>
                                </div>
                                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-all"></div></div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900">Autenticação SindicalID</p>
                                    <p className="text-xs text-gray-500">Login seguro e assinatura digital de documentos.</p>
                                </div>
                                <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer"><div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all"></div></div>
                              </div>
                            </div>
                            <button 
                              onClick={handleUpdateProfile}
                              disabled={isUpdatingProfile}
                              className="w-full py-5 bg-blue-900 text-white rounded-2xl font-bold text-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                              {isUpdatingProfile ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5" />
                              )}
                              Salvar Alterações
                            </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </main>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gray-50 flex flex-col"
          >
            {/* Header */}
            <header className="bg-[#1a3673] text-white sticky top-0 z-50 shadow-md">
              <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center shrink-0">
                  <div className="flex items-center group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="bg-white p-1 rounded-xl shadow-2xl transition-transform group-hover:scale-105">
                      {siteConfig.logoUrl ? (
                        <img 
                          src={siteConfig.logoUrl} 
                          style={{ width: `${siteConfig.headerLogoWidth * 0.9}px` }}
                          className="h-auto max-w-[180px]"
                          alt="Sinpa Logo" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Building2 className="text-[#1a3673] w-7 h-7" />
                      )}
                    </div>
                  </div>
                </div>

                <nav className="hidden xl:flex items-center gap-4 text-[13px] font-black uppercase tracking-tight flex-1 justify-center">
                  <a href="#inicio" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">Início</a>
                  <a href="#servicos" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">Serviços</a>
                  <a href="#noticias" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">Notícias</a>
                  <a href="#representatividade" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">Representatividade</a>
                  <a href="#indicadores" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">Indicadores</a>
                  <a href="#beneficios" className="text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap">
                    Clube de Benefícios
                  </a>
                  <a href="#certidao" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">Consulta Pública</a>
                  <a href="#contato" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">Contato</a>
                </nav>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden lg:flex items-center gap-3 border-r border-white/10 pr-3">
                    <button className="text-white/60 hover:text-amber-400 transition-colors">
                      <Bell className="w-5 h-5" />
                    </button>
                  </div>

                  <button 
                    className="xl:hidden p-2 text-white/60 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>

                  {currentUser ? (
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsPortalView(true)}>
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Acesso Administrativo</p>
                        <div className="flex items-center justify-end gap-2">
                           <span className="bg-amber-400 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">Admin</span>
                           <span className="text-sm font-bold text-white tracking-tight">{currentUser.displayName?.split(' ')[0]}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 group-hover:border-amber-400 transition-all">
                          {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-blue-950"></div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                        className="ml-2 text-white/20 hover:text-rose-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setAuthType('associate'); setShowAuthModal(true); }}
                        className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-white/5"
                      >
                        Portal
                      </button>
                      <button 
                        onClick={() => { setAuthType('admin'); setShowAuthModal(true); }}
                        className="bg-amber-400 text-blue-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-amber-400/10"
                      >
                        Admin
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="xl:hidden bg-[#1a3673] border-t border-white/5 overflow-hidden sticky top-[68px] z-40"
                >
                  <nav className="flex flex-col p-6 gap-4 text-xs font-black uppercase tracking-widest">
                    <a href="#inicio" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Início</a>
                    <a href="#servicos" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Serviços</a>
                    <a href="#noticias" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Notícias</a>
                    <a href="#representatividade" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Representatividade</a>
                    <a href="#indicadores" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Indicadores</a>
                    <a href="#beneficios" onClick={() => setIsMenuOpen(false)} className="text-amber-400 hover:text-amber-300">Clube de Benefícios</a>
                    <a href="#certidao" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Consulta Pública</a>
                    <a href="#contato" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-amber-400">Contato</a>
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                      <button 
                         onClick={() => { setAuthType('associate'); setShowAuthModal(true); setIsMenuOpen(false); }}
                         className="bg-white/5 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-center border border-white/10"
                      >
                        Portal
                      </button>
                    </div>
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>

        {authError && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthError(null)}
              className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white border-2 border-rose-100 p-8 sm:p-12 rounded-[48px] text-rose-900 shadow-[0_32px_64px_-16px_rgba(225,29,72,0.25)] flex flex-col gap-8 max-w-2xl w-full relative z-10 overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50"></div>
              
              <div className="flex items-start gap-6 relative">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[24px] flex items-center justify-center shadow-inner flex-shrink-0">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-black text-[12px] uppercase tracking-[0.2em] text-rose-400 mb-2">Protocolo de Segurança</p>
                  <h4 className="text-3xl font-bold text-rose-950 leading-tight">Configuração de Domínio Necessária</h4>
                </div>
                <button 
                  onClick={() => setAuthError(null)}
                  className="absolute -top-4 -right-4 p-2 text-rose-300 hover:text-rose-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-rose-50/50 p-8 rounded-[32px] border border-rose-100/50">
                  <div className="text-rose-900 font-bold leading-relaxed whitespace-pre-wrap mb-6">
                    {authError}
                  </div>
                  
                  {authError.toUpperCase().includes('DOMÍNIO NÃO AUTORIZADO') && (
                    <div className="space-y-6 mt-8 pt-8 border-t border-rose-100">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Passo a passo para liberar:</p>
                        <div className="grid gap-3">
                          {[
                            { step: 1, text: "Acesse o Console do Firebase" },
                            { step: 2, text: "Vá em Autenticação > Configurações" },
                            { step: 3, text: "Aba 'Domínios autorizados'" },
                            { step: 4, text: "Adicione o domínio abaixo:" }
                          ].map((item) => (
                            <div key={item.step} className="flex items-center gap-3 bg-white/50 p-3 rounded-2xl border border-rose-100/30">
                              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-black">{item.step}</span>
                              <span className="text-xs font-bold text-rose-800">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 bg-white px-5 py-4 rounded-2xl border-2 border-rose-200 shadow-sm">
                          <code className="text-xs font-mono font-black text-rose-700 flex-1 truncate select-all">
                            {window.location.hostname}
                          </code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.hostname);
                              const btn = document.getElementById('copy-domain-btn');
                              if (btn) btn.innerText = "Copiado!";
                              setTimeout(() => { if (btn) btn.innerText = "Copiar"; }, 2000);
                            }}
                            className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-rose-700 transition-all active:scale-95"
                            id="copy-domain-btn"
                          >
                            Copiar
                          </button>
                        </div>
                        <p className="text-[9px] text-rose-400 font-bold text-center uppercase tracking-widest">Clique acima para copiar o domínio exato</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a 
                    href="https://console.firebase.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 py-5 bg-blue-900 text-white rounded-[28px] font-bold text-sm hover:bg-blue-800 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 group"
                  >
                    <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                    Abrir Console Firebase
                  </a>
                  <button 
                    onClick={() => setAuthError(null)}
                    className="py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-[28px] font-bold text-sm hover:bg-rose-100 transition-all active:scale-95"
                  >
                    Entendido, vou ajustar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center pt-2 border-t border-rose-100/50">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Suporte Técnico SINPA</p>
              </div>
            </motion.div>
          </div>
        )}

      {/* Hero Section */}
      <section id="inicio" className="relative overflow-hidden bg-blue-900 text-white py-16 lg:py-24 scroll-mt-20">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-300 rounded-full blur-[100px] -ml-40 -mb-40"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-6 py-2 rounded-full bg-blue-800/50 text-blue-200 text-sm font-bold uppercase tracking-wider mb-6 border border-blue-700/50">
              Gestão Sindical Inteligente
            </span>
            <h2 className="text-4xl lg:text-5xl font-black leading-[1.1] mb-6 tracking-tighter">
              {siteConfig.heroTitle.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {word === 'Patronal' || word === 'Digital' ? <span className="text-amber-400">{word} </span> : word + ' '}
                </React.Fragment>
              ))}
            </h2>
            <p className="text-base lg:text-lg text-blue-100/70 mb-8 max-w-lg leading-relaxed font-medium">
              {siteConfig.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowMembershipForm(true)}
                className="bg-amber-400 text-blue-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-300 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20"
              >
                <Plus className="w-4 h-4" /> Seja um Associado
              </button>
              <button 
                onClick={() => setShowCalculator(true)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" /> Simulador de Custos
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 lg:gap-6"
          >
            {[
              { label: 'Associados', value: '+1.200', icon: Users },
              { label: 'Aprovação', value: '98%', icon: CheckCircle2 },
              { label: 'Movimentação', value: 'R$ 2M', icon: BarChart3 },
              { label: 'Portal Online', value: '24h', icon: Clock },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl hover:bg-white/15 transition-colors text-center sm:text-left">
                <stat.icon className="text-amber-400 w-8 h-8 mb-3 mx-auto sm:mx-0 opacity-80" />
                <h3 className="text-2xl lg:text-3xl font-black mb-0.5 tracking-tighter leading-none">{stat.value}</h3>
                <p className="text-[10px] opacity-50 font-black tracking-[0.2em] uppercase">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quick Services - NOVO */}
      <section id="servicos" className="py-12 bg-white -mt-12 relative z-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[32px] p-8 lg:p-10 shadow-2xl shadow-blue-900/10 border border-gray-50 grid md:grid-cols-4 gap-8"
          >
            {[
              { icon: FileCheck, label: 'Certidão Sindical', id: 'quitacao' },
              { icon: ShieldCheck, label: 'Regularidade', id: 'regularidade' },
              { icon: CreditCard, label: '2ª Via Boleto', id: 'boleto' },
              { icon: MessageCircle, label: 'Suporte Jurídico', external: true },
            ].map((s, i) => (
              <button 
                key={i}
                onClick={() => {
                  if (s.id) {
                    setActiveDocType(s.id as any);
                    document.getElementById('certidao')?.scrollIntoView({ behavior: 'smooth' });
                  } else if (s.external) {
                    document.getElementById('associados')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="group flex flex-col items-center text-center p-6 rounded-2xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                  <s.icon className="w-8 h-8" />
                </div>
                <span className="font-bold text-lg text-gray-800 tracking-tight">{s.label}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* News Section */}
      <section id="noticias" className="py-16 bg-gray-50/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <span className="text-blue-600 font-black tracking-[0.2em] text-[10px] uppercase mb-2 block">Informatividade</span>
              <h2 className="text-3xl lg:text-4xl font-black text-blue-950 tracking-tighter leading-none mb-3">Notícias e Comunicados</h2>
              <p className="text-gray-500 text-sm font-medium">As principais atualizações do setor sindical patronal.</p>
            </div>
            <button className="flex items-center justify-center gap-2 text-blue-900 font-bold hover:gap-4 transition-all group">
              Central de Notícias <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { type: 'Notícia', date: '15 Mai 2026', title: 'Reunião Setorial: Impactos da Nova Reforma', desc: 'Análise detalhada sobre as mudanças legislativas pautadas para este semestre.', isExternal: true, url: 'https://g1.globo.com' },
              { type: 'CONVENÇÃO', date: '12 Mai 2026', title: 'Aditivo Coletivo Vigente', desc: 'Publicado o termo aditivo referente ao reajuste do piso da categoria.' },
              { type: 'EVENTO', date: '10 Mai 2026', title: 'Workshop de Gestão Patronal', desc: 'Inscrições abertas para o seminário presencial sobre eficiência operacional.', isExternal: true, url: 'https://youtube.com' },
            ].map((news, i) => (
              <motion.div key={i} variants={fadeInUp} className="group bg-white rounded-3xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all text-left flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {news.type}
                  </span>
                  <span className="text-xs font-medium text-gray-400">{news.date}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 leading-snug group-hover:text-blue-900 transition-colors flex items-start gap-2">
                  {news.title}
                  {news.isExternal && <ExternalLink className="w-4 h-4 text-gray-300 mt-1.5 shrink-0" />}
                </h3>
                <p className="text-gray-500 mb-8 leading-relaxed text-base flex-1">
                  {news.desc}
                </p>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => news.url && window.open(news.url, '_blank')}
                    className="flex items-center gap-2 text-base font-bold text-blue-900 hover:gap-3 transition-all"
                  >
                    {news.isExternal ? 'Acessar link externo' : 'Ler matéria completa'} <ChevronRight className="w-5 h-5" />
                  </button>
                  {news.isExternal && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); alert('O download do PDF foi iniciado.'); }}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Baixar em PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Representatividade e Atuação Setorial */}
      <section id="representatividade" className="py-24 bg-blue-950 text-white relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 grayscale"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-amber-400 font-bold tracking-widest text-sm uppercase mb-4 block">Defesa de Interesses</span>
              <h2 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">Voz Ativa junto aos Poderes Públicos</h2>
              <p className="text-blue-100/70 text-xl mb-10 leading-relaxed">
                Nossa atuação vai além dos benefícios. Representamos sua empresa em negociações coletivas, 
                conselhos paritários e diálogos com o Poder Legislativo para garantir a sustentabilidade 
                e competitividade do nosso setor.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    <ShieldCheck className="w-8 h-8 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-2xl">Negociação Coletiva</h4>
                  <p className="text-base text-blue-100/50">Equilíbrio nas relações de trabalho e segurança jurídica para o empresário.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    <Globe className="w-8 h-8 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-2xl">Pleitos Setoriais</h4>
                  <p className="text-base text-blue-100/50">Articulação junto a federações e órgãos governamentais por melhorias no ambiente de negócios.</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[48px] p-12 shadow-2xl relative z-10">
                <blockquote className="text-3xl font-serif italic mb-8 text-blue-100 leading-relaxed">
                  "Um setor forte é construído com união. O sindicato é a ferramenta de equilíbrio necessária para o progresso empresarial."
                </blockquote>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center font-bold text-blue-950 text-2xl shadow-xl">PR</div>
                  <div>
                    <p className="font-black text-xl">Presidência</p>
                    <p className="text-base text-white/50">Biênio 2025/2027</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-amber-400/20 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores do Setor */}
      <section id="indicadores" className="py-16 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-black tracking-[0.2em] text-[10px] uppercase mb-2 block">Inteligência de Mercado</span>
            <h2 className="text-3xl lg:text-5xl font-black text-[#1a3673] mb-4 tracking-tighter">Painel de Indicadores</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base lg:text-lg font-medium italic">
              Dados atualizados sobre a evolução do setor patronal.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gray-50 rounded-[40px] p-10 border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <TrendingUp className="text-blue-600 w-8 h-8" />
                  Evolução do Faturamento Médio
                </h3>
                <div className="flex gap-2">
                  <span className="px-4 py-2 bg-white rounded-full text-xs font-black text-gray-400 border border-gray-100">6 MESES</span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sectorData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                    <YAxis hide />
                    <ChartTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-8">
              {[
                { label: 'Empregabilidade', value: '+12.4%', color: 'emerald', icon: Users },
                { label: 'Novas Empresas', value: '342', color: 'blue', icon: Building2 },
                { label: 'Índice de Confiança', value: '8.4', color: 'amber', icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-shadow group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                      <stat.icon className="w-8 h-8" />
                    </div>
                    <span className={`text-sm font-black text-${stat.color}-600`}>{stat.label === 'Empregabilidade' ? '↑' : ''} {stat.label === 'Índice de Confiança' ? '/ 10' : ''}</span>
                  </div>
                  <h4 className="text-base font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</h4>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios e Clube de Vantagens */}
      <section id="beneficios" className="py-20 bg-white overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-20 gap-10">
            <div className="max-w-2xl">
              <span className="text-amber-600 font-black tracking-[0.2em] text-[10px] uppercase mb-3 block">Exclusivo Associados</span>
              <h2 className="text-4xl lg:text-6xl font-black text-blue-950 tracking-tighter mb-6">Clube de Benefícios</h2>
              <p className="text-gray-600 text-base lg:text-lg leading-relaxed font-medium">
                Empresas associadas possuem acesso a uma rede de descontos e parcerias estratégicas 
                que reduzem custos e agregam valor ao negócio.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
                <div className="bg-amber-500 text-white p-3 rounded-2xl">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">+50 Parceiros</h4>
                  <p className="text-xs text-amber-700 font-medium tracking-wide">Rede Credenciada</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: 'Planos de Saúde', 
                desc: 'Desconto de até 40% em convênios empresariais para colaboradores e sócios.', 
                icon: ShieldCheck, 
                color: 'blue' 
              },
              { 
                title: 'Consumíveis & Energia', 
                desc: 'Parcerias com distribuidoras para redução de custos fixos operacionais.', 
                icon: Zap, 
                color: 'amber' 
              },
              { 
                title: 'Contabilidade & Jurídico', 
                desc: 'Consultoria gratuita mensal para dúvidas trabalhistas e fiscais.', 
                icon: FileText, 
                color: 'emerald' 
              },
              { 
                title: 'Capacitação EAD', 
                desc: 'Acesso liberado a cursos de gestão e treinamentos técnicos do setor.', 
                icon: LayoutDashboard, 
                color: 'purple' 
              }
            ].map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white border border-gray-100 rounded-[32px] p-8 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-2 transition-all cursor-pointer"
              >
                <div className={`w-14 h-14 bg-${benefit.color}-50 text-${benefit.color}-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-900 group-hover:text-white transition-colors`}>
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-blue-900 transition-colors uppercase tracking-tight">{benefit.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {benefit.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-blue-900 rounded-[40px] flex flex-col lg:flex-row items-center justify-between gap-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Briefcase className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-1 italic font-serif">Banco de Oportunidades</h4>
                <p className="opacity-70 text-sm font-medium tracking-wide">Plataforma exclusiva de vagas e currículos integrada para o setor.</p>
              </div>
            </div>
            <button className="bg-white text-blue-900 px-8 py-4 rounded-2xl font-bold hover:bg-amber-400 hover:text-blue-950 transition-all flex items-center gap-3">
              Divulgar Nova Vaga <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Simuladores e Ferramentas Práticas */}
      <section id="ferramentas" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <motion.div 
                {...fadeInUp}
                className="bg-white rounded-[40px] p-8 lg:p-12 shadow-2xl border border-gray-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    Simulador de Impacto Trabalhista
                  </h3>
                  <button onClick={() => setCalcBaseSalary(2500)} className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline">Reiniciar</button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-gray-600">Salário Base do Colaborador</label>
                      <span className="text-lg font-bold text-blue-900">R$ {calcBaseSalary.toLocaleString('pt-BR')}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1412" 
                      max="15000" 
                      step="100"
                      value={calcBaseSalary}
                      onChange={(e) => setCalcBaseSalary(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-gray-600">Reajuste Previsto (%)</label>
                      <span className="text-lg font-bold text-blue-900">{calcAdjustment}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      step="0.5"
                      value={calcAdjustment}
                      onChange={(e) => setCalcAdjustment(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-12">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Novo Salário</span>
                      <p className="text-xl font-bold text-blue-950 font-mono">R$ {calc.newSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Encargos + Provisões</span>
                      <p className="text-xl font-bold text-rose-600 font-mono">R$ {calc.totalCharges.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="bg-blue-900 p-8 rounded-3xl text-white shadow-xl shadow-blue-900/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest block mb-1">Custo Mensal Total p/ Empresa</span>
                        <p className="text-3xl font-bold font-mono">R$ {calc.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <Send className="w-10 h-10 opacity-20" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-4 block">Inteligência Operacional</span>
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">Ferramentas de <br /> Apoio Decisório</h2>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                Disponibilizamos calculadoras integradas para que sua empresa tenha previsibilidade 
                financeira imediata sobre dissídios e reajustes salariais aprovados em assembleia.
              </p>
              <div className="space-y-4">
                {[
                  'Cálculo automático de provisões trabalhistas (FGTS/INSS)',
                  'Simulador de reajuste conforme CCT',
                  'Integração com tabela de tributação patronal vigente',
                  'Exportação de relatório simplificado em PDF'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-3 h-3 text-blue-900" />
                    </div>
                    <span className="font-medium text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="certidao" className="py-20 bg-blue-50 border-y border-blue-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-4 block">Emissão Inteligente</span>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">Autoatendimento Digital</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Sistema automatizado para emissão de certidões, declarações e boletos. 
                Selecione o serviço desejado e informe os dados para validação.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  { id: 'quitacao', label: 'Certidão de Quitação', icon: FileCheck },
                  { id: 'regularidade', label: 'Regularidade Sindical', icon: ShieldCheck },
                  { id: 'boleto', label: '2ª Via de Boleto', icon: CreditCard },
                ].map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => {
                      setActiveDocType(type.id as any);
                      setCertificateResult(null);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      activeDocType === type.id 
                        ? 'bg-blue-900 text-white border-blue-900 shadow-lg' 
                        : 'bg-white text-gray-700 border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <type.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-sm">{type.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, text: 'Segurança com autenticação por chave única' },
                  { icon: ShieldCheck, text: 'Documentos com validade jurídica nacional' },
                  { icon: FileCheck, text: 'Geração em PDF com assinatura digital' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.div 
              {...fadeInUp}
              className="bg-white rounded-[40px] p-8 lg:p-12 shadow-2xl shadow-blue-900/10 border border-white"
            >
              <form onSubmit={handleSearch} className="relative z-10 mb-8">
                <div className="relative">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                    {activeDocType === 'boleto' ? 'Consulta de Débito' : 'Validação de Registro'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Informe seu CNPJ ou CPF"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                      />
                    </div>
                    <button 
                      disabled={isSearching}
                      className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-950/20"
                    >
                      {activeDocType === 'boleto' ? 'Listar Boletos' : 'Validar'}
                    </button>
                  </div>
                </div>
              </form>

              <AnimatePresence mode="wait">
                {isSearching ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 text-center"
                  >
                    <div className="inline-block w-12 h-12 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Consultando registros...</p>
                  </motion.div>
                ) : certificateResult === 'active' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-emerald-50 rounded-[32px] p-8 border border-emerald-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck className="w-24 h-24 text-emerald-900" />
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-0.5">Status do Associado</span>
                          <h3 className="text-2xl font-bold text-emerald-900">REGULARIZADO</h3>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-sm py-2 border-b border-emerald-900/5">
                          <span className="text-emerald-800/60 font-medium tracking-wide uppercase text-[10px]">Identificação</span>
                          <span className="text-emerald-900 font-bold font-mono">{searchTerm}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-emerald-900/5">
                          <span className="text-emerald-800/60 font-medium tracking-wide uppercase text-[10px]">Data da Consulta</span>
                          <span className="text-emerald-900 font-bold">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <p className="text-emerald-800/70 text-sm leading-relaxed mb-8">
                        Não constam débitos ou pendências administrativas registradas até a presente data. 
                        A Certidão de Quitação está válida e disponível para emissão eletrônica.
                      </p>

                      <button 
                        onClick={() => setShowPrintModal(true)}
                        className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 hover:scale-[1.02]"
                      >
                        <Printer className="w-5 h-5" /> Emitir {activeDocType === 'quitacao' ? 'Certidão Sindical' : 'Declaração de Regularidade'}
                      </button>
                    </div>
                  </motion.div>
                ) : certificateResult === 'pending' ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-rose-50 rounded-[32px] p-8 border border-rose-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert className="w-24 h-24 text-rose-900" />
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block mb-0.5">Status do Associado</span>
                          <h3 className="text-2xl font-bold text-rose-900">PENDENTE</h3>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-sm py-2 border-b border-rose-900/5">
                          <span className="text-rose-800/60 font-medium tracking-wide uppercase text-[10px]">Identificação</span>
                          <span className="text-rose-900 font-bold font-mono">{searchTerm}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-rose-800/60 font-medium tracking-wide uppercase text-[10px]">Motivo</span>
                          <span className="text-rose-900 font-bold">Débitos Administrativos</span>
                        </div>
                      </div>

                      <p className="text-rose-800/70 text-sm leading-relaxed mb-8">
                        Foram identificadas pendências financeiras ou documentais que impedem a emissão instantânea da certidão.
                        Favor regularizar no painel do associado ou entrar em contato com o sindicato.
                      </p>

                      <button className="w-full bg-rose-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-800 transition-all shadow-lg shadow-rose-900/20 hover:scale-[1.02]">
                        Ver Extrato Detalhado
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-8 text-center text-gray-400 italic">
                    Insira o CNPJ/CPF acima para iniciar a validação.
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Management / Directors */}
      <section id="diretoria" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6">Nossa Equipe</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Equipe dedicada à excelência no atendimento e à defesa dos interesses do setor.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'presidencia', label: 'Presidência' },
              { id: 'diretoria', label: 'Diretoria' },
              { id: 'gerencia', label: 'Gerência' },
              { id: 'atendimento', label: 'Atendimento' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTeamFilter(tab.id as any)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  teamFilter === tab.id 
                    ? 'bg-blue-900 border-blue-900 text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers
              .filter(m => teamFilter === 'all' || m.category === teamFilter)
              .map((p, i) => (
              <motion.div 
                key={p.id} 
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center hover:shadow-xl transition-shadow"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="text-blue-300 w-10 h-10" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-blue-600 font-semibold text-sm mb-6 uppercase tracking-wide">{p.role}</p>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">
                  {p.category}
                </div>
                <button className="w-full bg-gray-50 text-gray-700 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-900 hover:text-white transition-colors">
                  Ver Perfil
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Área do Associado - CTA */}
      <section id="associados" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-blue-900 rounded-[48px] p-8 lg:p-20 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <ShieldCheck className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-amber-400 font-bold tracking-widest text-xs uppercase mb-4 block">Acesso Restrito</span>
                <h2 className="text-5xl font-bold mb-6 font-display">Portal Digital do Associado</h2>
                <p className="text-blue-100/70 text-lg mb-10 leading-relaxed">
                  Gerenciamento centralizado de guias, convenções, votações e serviços contábeis em uma interface moderna e segura.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => {
                      if (currentUser) {
                        setIsPortalView(true);
                      } else {
                        handleLogin();
                      }
                    }}
                    className="bg-amber-400 text-blue-950 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-amber-300 transition-all shadow-xl shadow-amber-900/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Fingerprint className="w-6 h-6 border-r border-blue-900/20 pr-3" />
                    {currentUser ? 'Acessar Meu Painel' : 'Entrar no Portal'}
                  </button>
                  {!currentUser && (
                    <button className="bg-white/10 border border-white/20 px-8 py-5 rounded-2xl font-bold hover:bg-white/20 transition-all text-sm uppercase tracking-widest">
                      Seja um Associado
                    </button>
                  )}
                </div>
              </div>
              
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { label: 'Guias & Boletos', icon: CreditCard },
                  { label: 'Assembleia Virtual', icon: Vote },
                  { label: 'Certidões Online', icon: ShieldCheck },
                  { label: 'Portal Contador', icon: UserCheck },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center">
                    <item.icon className="w-10 h-10 text-amber-400 mb-4" />
                    <span className="font-bold text-sm leading-tight text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {/* IA Advisor Toggle */}
        <motion.button
          onClick={() => setShowAIAdvisor(!showAIAdvisor)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-blue-900 text-white p-4 rounded-full shadow-2xl shadow-blue-900/40 flex items-center justify-center group relative overflow-hidden"
        >
          <Bot className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 bg-amber-400 text-blue-950 font-bold px-2 py-0.5 rounded-full text-[10px] animate-bounce">IA</span>
        </motion.button>

        {/* WhatsApp Button */}
        <motion.a
          href={`https://wa.me/${whatsappNumber}?text=Olá,%20gostaria%20de%20mais%20informações%20sobre%20o%20sindicato.`}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-emerald-500 text-white p-4 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center group"
        >
          <MessageCircle className="w-8 h-8" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-3 transition-all duration-300 font-bold whitespace-nowrap">
            Fale Conosco
          </span>
        </motion.a>
      </div>

      {/* IA Advisor Sidebar/Modal */}
      <AnimatePresence>
        {showAIAdvisor && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIAdvisor(false)}
              className="fixed inset-0 bg-blue-950/20 backdrop-blur-sm z-[110]"
            ></motion.div>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[120] flex flex-col border-l border-gray-100"
            >
              <div className="p-8 bg-blue-900 text-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                      <Bot className="w-7 h-7 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Assessor Virtual</h3>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Sistema Online
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAIAdvisor(false)} 
                    className="p-2 hover:bg-white/10 rounded-xl transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-blue-100/70 text-sm leading-relaxed italic">
                  "Olá! Sou a inteligência artificial do Sindicato. Posso te ajudar com dúvidas sobre Convenções Coletivas, Legislação e Benefícios."
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {aiChat.length === 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[
                      'O que mudou na CCT 2026?',
                      'Como calcular reajuste?',
                      'Quais os benefícios?',
                      'Prazo de contribuição'
                    ].map((suggestion, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setUserInput(suggestion);
                          // We don't trigger send automatically to let users edit
                        }}
                        className="p-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-500 hover:border-blue-900 hover:text-blue-900 transition-all text-left flex items-start gap-2 group shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 group-hover:text-blue-900" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                {aiChat.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-5 rounded-[24px] shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-900 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}

                {aiLoading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex justify-start my-8"
                  >
                    <div className="bg-blue-900 border border-blue-800 p-8 rounded-[32px] rounded-tl-none shadow-2xl flex flex-col items-center gap-6 max-w-sm mx-auto text-center">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        {/* Multiple rings for extra circular loader prominence */}
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                        <Loader2 className="w-8 h-8 text-white" />
                        <div className="absolute -inset-4 bg-amber-400/20 rounded-full animate-ping"></div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-bold text-lg animate-pulse">Processando sua solicitação...</p>
                        <p className="text-blue-200 text-xs font-medium opacity-70">O Assessor Jurídico está analisando sua dúvida com base na CCT.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-white">
                <div className="relative flex items-center gap-3">
                  <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAISend()}
                    placeholder="Sua dúvida aqui..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all font-medium text-sm"
                  />
                  <button 
                    onClick={handleAISend}
                    disabled={aiLoading || !userInput.trim()}
                    className="bg-blue-900 text-white p-4 rounded-2xl hover:bg-blue-800 disabled:opacity-50 shadow-lg shadow-blue-900/20 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Financial Section */}
      <section id="financeiro" className="py-24 bg-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <span className="text-amber-400 font-bold tracking-widest text-xs uppercase mb-4 block">Transparência Total</span>
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">Gestão Financeira Descomplicada</h2>
              <p className="text-lg opacity-70 mb-10 leading-relaxed">
                Acompanhe em tempo real a saúde financeira do sindicato. Controle de receitas, 
                aprovação de despesas e prestação de contas automatizada para todos os associados.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: 'Fluxo Automatizado', desc: 'Integração direta com sistemas bancários.' },
                  { title: 'Aprovação Digital', desc: 'Diretoria aprova despesas via app com assinatura digital.' },
                  { title: 'Prestação de Contas', desc: 'Relatórios mensais interativos para transparência.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-800">
                      <LayoutDashboard className="text-amber-400 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm opacity-60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold">Relatório Executivo</h3>
                  <p className="text-sm opacity-50">Mês de Maio / 2026</p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition">
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Contribuições', amount: '+ R$ 145.200', type: 'in' },
                  { label: 'Serviços Jurídicos', amount: '- R$ 12.400', type: 'out' },
                  { label: 'Custeio Operacional', amount: '- R$ 45.000', type: 'out' },
                ].map((tr, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span className="font-medium text-sm opacity-80">{tr.label}</span>
                    <span className={`font-mono font-bold ${tr.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tr.amount}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-40 font-bold">Saldo Disponível</p>
                  <p className="text-3xl font-bold text-amber-400">R$ 1.482.900,00</p>
                </div>
                <LayoutDashboard className="w-12 h-12 opacity-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Consulta Pública de Associados */}
      <section id="publico" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-blue-900 rounded-[40px] p-10 lg:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-20 opacity-5">
              <Globe className="w-96 h-96" />
            </div>
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-amber-400 font-bold tracking-widest text-xs uppercase mb-4 block">Transparência Coletiva</span>
                <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">Consulta Pública de Empresas Associadas</h2>
                <p className="text-blue-100/70 text-lg mb-10">
                  Verifique a regularidade sindical de qualquer empresa do setor. 
                  O selo de associado garante o cumprimento das normas coletivas e acesso a benefícios exclusivos.
                </p>
                <div className="flex bg-white/10 p-2 rounded-2xl border border-white/20">
                  <input 
                    type="text" 
                    value={publicSearchTerm}
                    onChange={(e) => setPublicSearchTerm(e.target.value)}
                    placeholder="Nome da empresa ou CNPJ..."
                    className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder:text-white/30 font-medium"
                  />
                  <button 
                    onClick={() => setPublicSearchResult(['Ind. Metalurgica Ltda'])}
                    className="bg-amber-400 text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-300 transition-all"
                  >
                    Consultar
                  </button>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 h-full min-h-[300px] flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  {!publicSearchResult ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <Search className="w-12 h-12 text-white/20 mx-auto" />
                      <p className="text-white/40 text-sm">Aguardando termo de pesquisa para validar registro.</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white text-blue-900 p-8 rounded-[32px] w-full shadow-2xl relative"
                    >
                      <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Empresa Associada</h4>
                      <p className="text-2xl font-bold mb-2">INDUSTRIA METALURGICA LTDA</p>
                      <p className="text-sm text-gray-500 mb-8">Filiado em: Janeiro/2021</p>
                      <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-center gap-3">
                        <QRCodeCanvas value="VERIFIED-CO" size={80} />
                        <div className="text-left">
                          <p className="text-xs font-bold text-blue-900 uppercase">Selo de Regularidade</p>
                          <p className="text-[10px] text-blue-900/60 font-mono">HASH: FD992384</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suggestion Channel */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Canal de Sugestões</h2>
            <p className="text-gray-500 text-lg">
              Sua opinião é fundamental. Envie ideias, críticas ou sugestões de melhoria 
              para fortalecer nossa atuação institucional.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 p-8 lg:p-12 rounded-[40px] border border-gray-100 shadow-sm"
          >
            <form onSubmit={submitSuggestion} className="space-y-6">
              {suggestionStatus && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`p-4 rounded-2xl flex items-center gap-3 ${
                    suggestionStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    suggestionStatus.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
                  }`}>
                    {suggestionStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>
                  <p className="text-sm font-bold">{suggestionStatus.message}</p>
                </motion.div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={suggestionForm.name}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    value={suggestionForm.email}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, email: e.target.value })}
                    placeholder="joao@empresa.com.br"
                    className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all font-medium"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Sua Mensagem</label>
                <textarea 
                  rows={5}
                  value={suggestionForm.message}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, message: e.target.value })}
                  placeholder="Descreva sua sugestão detalhadamente..."
                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all font-medium resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={isSendingSuggestion}
                className="w-full bg-blue-900 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSendingSuggestion ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )} 
                {isSendingSuggestion ? 'Enviando...' : 'Enviar Sugestão'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      {/* Print Confirmation Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrintModal(false)}
              className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 lg:p-10 max-w-md w-full shadow-2xl relative z-10 border border-gray-100"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mb-6">
                <Printer className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display">Confirmar Emissão?</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Você está prestes a gerar a <span className="font-bold text-blue-900 underline">
                  {activeDocType === 'quitacao' ? 'Certidão Sindical' : 'Declaração de Regularidade'}
                </span> para o registro <span className="font-bold text-blue-900">{searchTerm}</span>. 
                Deseja prosseguir com a geração do documento oficial assinado eletronicamente?
              </p>

              <div className="bg-blue-900 rounded-3xl p-6 flex items-center gap-6 mb-8 shadow-xl text-white">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                   <QRCodeCanvas value={`CERT-${searchTerm || '99283'}`} size={90} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Validação Digital</p>
                  <p className="text-xs font-medium text-blue-100/70 mb-4 leading-snug tracking-tight">Documento oficial com assinatura e QR Code de autenticidade instantânea.</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                    <Hash className="w-3 h-3" />
                    AUTHTOKEN-{searchTerm?.slice(0,4) || '9928'}-2026
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                    window.print();
                  }}
                  className="flex-1 px-6 py-4 rounded-xl font-bold bg-blue-900 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Membership Request Modal */}
      <AnimatePresence>
        {showMembershipForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMembershipForm(false)}
              className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[44px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-blue-950 font-display tracking-tighter leading-none">Seja um Associado</h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Formulário de Pré-Filiação Sindical</p>
                  </div>
                  <button 
                    onClick={() => setShowMembershipForm(false)}
                    className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleMembershipSubmit} className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Razão Social / Nome da Empresa</label>
                    <input 
                      type="text" 
                      required
                      value={membershipData.companyName}
                      onChange={(e) => setMembershipData({...membershipData, companyName: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                      placeholder="Ex: Minha Empresa LTDA"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">CNPJ</label>
                    <input 
                      type="text" 
                      required
                      value={membershipData.cnpj}
                      onChange={(e) => setMembershipData({...membershipData, cnpj: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Capital Social (R$)</label>
                    <input 
                      type="number" 
                      required
                      value={membershipData.capitalSocial}
                      onChange={(e) => setMembershipData({...membershipData, capitalSocial: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                      placeholder="Ex: 50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      required
                      value={membershipData.email}
                      onChange={(e) => setMembershipData({...membershipData, email: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                      placeholder="contato@empresa.com.br"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Telefone / WhatsApp</label>
                    <input 
                      type="tel" 
                      required
                      value={membershipData.phone}
                      onChange={(e) => setMembershipData({...membershipData, phone: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Nome do Representante Legal</label>
                    <input 
                      type="text" 
                      required
                      value={membershipData.representative}
                      onChange={(e) => setMembershipData({...membershipData, representative: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                      placeholder="Nome completo do sócio/diretor"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-4">
                    <button 
                      type="submit"
                      disabled={isSubmittingMembership}
                      className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmittingMembership ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Enviando...
                        </>
                      ) : (
                        'Solicitar Filiação Agora'
                      )}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-tighter">Ao enviar, você concorda com os termos de análise sindical e LGPD.</p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#1a3673] tracking-tighter mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-sm">Respostas geradas por IA baseadas na CCT vigente</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {faqs.length > 0 ? faqs.map((faq, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="p-8 rounded-[40px] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{faq.category}</span>
                </div>
                <h4 className="text-xl font-bold text-[#1a3673] mb-4 group-hover:text-amber-500 transition-colors uppercase tracking-tight italic leading-tight">
                  {faq.question}
                </h4>
                <p className="text-gray-600 leading-relaxed text-sm font-medium">
                  {faq.answer}
                </p>
              </motion.div>
            )) : (
              <div className="col-span-2 text-center py-12 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Aguarde a atualização do FAQ pela administração.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer id="contato" className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-white/5">
                  {siteConfig.logoUrl ? (
                    <img 
                      src={siteConfig.logoUrl} 
                      style={{ width: `${siteConfig.footerLogoWidth}px` }}
                      className="h-auto"
                      alt="Sinpa Logo" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Building2 className="text-blue-900 w-8 h-8" />
                  )}
                </div>
                <h3 className="text-3xl font-black tracking-tight leading-none text-white">Sinpa<br /><span className="text-amber-400">Portal</span></h3>
              </div>
              <p className="text-gray-400 max-w-sm mb-10 text-lg leading-relaxed font-medium">
                Transformando a gestão sindical com tecnologia, transparência 
                e foco real nas necessidades dos nossos associados.
              </p>
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-blue-900 transition-all cursor-pointer hover:scale-110">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-blue-900 transition-all cursor-pointer hover:scale-110">
                  <Phone className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-xl mb-8 text-amber-400 uppercase tracking-widest">Links Úteis</h4>
              <ul className="space-y-6 text-gray-400 text-lg font-bold">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Institucional</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xl mb-8 text-amber-400 uppercase tracking-widest">Atendimento</h4>
              <ul className="space-y-6 text-gray-400 text-lg font-bold">
                <li className="flex items-center gap-4"><Clock className="w-5 h-5 text-amber-400" /> Seg - Sex: 08h às 18h</li>
                <li className="flex items-center gap-4"><Phone className="w-5 h-5 text-amber-400" /> (00) 0000-0000</li>
                <li className="flex items-center gap-4"><Mail className="w-5 h-5 text-amber-400" /> contato@sindicato.com.br</li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 text-center text-gray-500 text-base font-bold">
            <p>&copy; 2026 Sindicato Patronal Sinpa Digital. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Partner Modal */}
      <AnimatePresence>
        {showAddPartnerModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddPartnerModal(false)}
              className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[44px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-bold text-blue-900 font-display">Novo Parceiro</h3>
                    <p className="text-gray-500 font-medium">Preencha os dados do novo convênio do clube.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddPartnerModal(false)}
                    className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddPartner} className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 italic">Nome da Empresa</label>
                    <input 
                      type="text" 
                      required
                      value={newPartnerForm.name}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, name: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl font-black text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none shadow-sm"
                      placeholder="Ex: Unimed Saúde"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 italic">Desconto</label>
                    <input 
                      type="text" 
                      required
                      value={newPartnerForm.discount}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, discount: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl font-black text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none shadow-sm"
                      placeholder="Ex: 20%"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 italic">Categoria</label>
                    <select 
                      value={newPartnerForm.category}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, category: e.target.value as any})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl font-black text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none appearance-none shadow-sm"
                    >
                      <option value="saude">Saúde</option>
                      <option value="educacao">Educação</option>
                      <option value="lazer">Lazer</option>
                      <option value="servicos">Serviços</option>
                      <option value="comercio">Comércio</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-4 italic flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Vencimento do Acordo (Data de Expiração)
                    </label>
                    <input 
                      type="date" 
                      required
                      value={newPartnerForm.expiresAt}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, expiresAt: e.target.value})}
                      className="w-full bg-blue-50 border border-blue-100 px-6 py-4 rounded-2xl font-black text-blue-900 focus:bg-white focus:border-blue-900 transition-all outline-none shadow-sm"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Logotipo (Upload ou URL)</label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={newPartnerForm.logo}
                          onChange={(e) => setNewPartnerForm({...newPartnerForm, logo: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                          placeholder="URL da imagem (ex: https://...)"
                        />
                      </div>
                      <label className="relative shrink-0 flex items-center justify-center w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all group overflow-hidden">
                        {newPartnerForm.logo && (newPartnerForm.logo.startsWith('data:') || newPartnerForm.logo.startsWith('blob:')) ? (
                          <img src={newPartnerForm.logo} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <Upload className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 setNewPartnerForm({...newPartnerForm, logo: reader.result as string});
                                 showNotification('success', 'Imagem carregada com sucesso!');
                               };
                               reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium px-4">Dica: Formatos PNG ou JPG recomendados.</p>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Link do Site do Parceiro (Opcional)</label>
                    <input 
                      type="url" 
                      value={newPartnerForm.website}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, website: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none"
                      placeholder="URL do site (ex: https://...)"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Descrição</label>
                    <textarea 
                      required
                      value={newPartnerForm.description}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, description: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl font-bold text-gray-900 focus:bg-white focus:border-blue-900 transition-all outline-none h-32 resize-none"
                      placeholder="Descreva o benefício..."
                    />
                  </div>

                  <div className="col-span-2 pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-blue-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-800 hover:scale-[1.02] transition-all"
                    >
                      Salvar Novo Parceiro
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Modal Recibo/Termo de Acordo */}
        {showAgreementModal && (
          <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <FileCheck className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-blue-950 uppercase tracking-tighter">Termo de Acordo</h3>
                      <p className="text-sm font-bold text-gray-400">Leia atentamente as condições abaixo</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAgreementModal(false)}
                    className="p-3 hover:bg-gray-50 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 mb-8 max-h-[300px] overflow-y-auto">
                   <pre className="text-xs font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
{`TERMO DE ACORDO EXTRAJUDICIAL E CONFISSÃO DE DÍVIDA

Pelo presente instrumento, conforme as diretrizes do Sindicato Patronal (SINPA), as partes declaram estar de comum acordo quanto aos termos de quitação de débitos pendentes para a empresa ${agreementCompany?.name}.

DADOS DO ACORDO:
- Tipo: ${agreementType === 'avista' ? 'PAGAMENTO À VISTA (10% de Desconto)' : 'PARCELAMENTO SEM JUROS'}
- Valor Base: R$ ${agreementCompany?.debt?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Valor do Acordo: R$ ${(agreementType === 'avista' ? agreementCompany?.debt * 0.9 : agreementCompany?.debt)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

CONDIÇÕES GERAIS:
1. O Devedor reconhece integralmente a dívida e se compromete a efetuar o pagamento conforme a modalidade selecionada.
2. Cláusula de Quebra: O não pagamento de qualquer parcela ou do valor integral à vista implicará no cancelamento imediato deste acordo, com o retorno do valor original do débito e cobrança de encargos legais.
3. LGPD: Os dados coletados neste termo serão utilizados exclusivamente para fins de gestão financeira e regularização sindical, em conformidade com a Lei Geral de Proteção de Dados.
4. Validade: Este acordo passa a ter validade jurídica imediata após o aceite eletrônico do representante legal da empresa.

Aceito o presente termo em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}.`}
                   </pre>
                </div>

                <label className="flex items-start gap-4 p-6 bg-blue-50/50 border border-blue-100 rounded-3xl cursor-pointer group hover:bg-blue-50 transition-all mb-8">
                  <div className="relative flex items-center justify-center mt-1">
                    <input 
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={(e) => setAgreementAccepted(e.target.checked)}
                      className="peer appearance-none w-6 h-6 border-2 border-blue-200 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all"
                    />
                    <Check className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-all" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900 leading-snug">
                      Eu li e concordo com os termos do acordo extrajudicial e confissão de dívida.
                    </p>
                    <p className="text-[10px] font-medium text-blue-600/60 uppercase tracking-widest mt-1">Aceite obrigatório para prosseguir</p>
                  </div>
                </label>

                <div className="flex gap-4">
                   <button 
                    onClick={() => setShowAgreementModal(false)}
                    className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleFinalizeAgreement}
                    disabled={!agreementAccepted}
                    className="flex-[2] py-5 bg-blue-900 text-white rounded-3xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Confirmar Acordo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Banner LGPD */}
        <AnimatePresence>
          {showLGPD && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 left-8 right-8 md:left-auto md:max-w-md z-[90] bg-white/95 backdrop-blur shadow-2xl rounded-[32px] border border-blue-100 p-8 flex flex-col gap-6"
            >
              <div className="flex items-start gap-5">
                 <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7 text-blue-600" />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-lg font-black text-blue-950 uppercase tracking-tighter mb-2">Sua Privacidade</h4>
                    <p className="text-xs font-medium text-gray-500 leading-relaxed">
                      Nós utilizamos cookies e tecnologias de segurança para melhorar sua experiência e proteger seus dados corporativos conforme a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
                    </p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button 
                    onClick={() => {
                        localStorage.setItem('lgpd_accepted', 'true');
                        setShowLGPD(false);
                    }}
                    className="flex-1 py-4 bg-blue-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-900/20"
                 >
                    Continuar e Aceitar
                 </button>
                 <button className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">
                    Termos
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIX Payment Modal */}
        <AnimatePresence>
          {showPixModal && selectedBoletoPix && (
            <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
              >
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                        <QrCode className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-blue-950 uppercase tracking-tighter">Pagamento via PIX</h3>
                        <p className="text-sm font-bold text-gray-400">Escaneie o QR Code ou copie a chave</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowPixModal(false)}
                      className="p-3 hover:bg-gray-50 rounded-2xl transition-all"
                    >
                      <X className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10 flex flex-col items-center gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl shadow-inner border border-gray-100">
                      <QRCodeCanvas 
                        value={generatePixPayload(selectedBoletoPix.valor, String(selectedBoletoPix.id || selectedBoletoPix.doc))}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-blue-900 text-lg uppercase tracking-widest">{selectedBoletoPix.valor}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{selectedBoletoPix.doc}</p>
                      {selectedBoletoPix.id && (
                        <p className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-[0.1em] mt-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
                          ID Ref: {String(selectedBoletoPix.id).toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl relative group">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Código PIX Copia e Cola</p>
                      <p className="text-[10px] font-mono text-blue-900 break-all pr-12 line-clamp-2">
                        {generatePixPayload(selectedBoletoPix.valor, String(selectedBoletoPix.id || selectedBoletoPix.doc))}
                      </p>
                      <button 
                        onClick={() => {
                          const payload = generatePixPayload(selectedBoletoPix.valor, String(selectedBoletoPix.id || selectedBoletoPix.doc));
                          navigator.clipboard.writeText(payload);
                          showNotification('success', 'Código PIX copiado!');
                        }}
                        className="absolute top-1/2 -translate-y-1/2 right-4 p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all z-10"
                        title="Copiar código"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => setShowPixModal(false)}
                      className="w-full py-5 bg-blue-900 text-white rounded-3xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Já realizei o pagamento
                    </button>
                  </div>
                  
                  <p className="text-center text-[9px] text-gray-400 font-bold mt-6 uppercase tracking-widest">
                    A compensação via PIX é instantânea.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[999] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 min-w-[320px] max-w-md ${
              globalMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              globalMessage.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            {globalMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
             globalMessage.type === 'error' ? <AlertCircle className="w-6 h-6 text-rose-500" /> :
             <Info className="w-6 h-6 text-blue-500" />}
            <div className="flex-1">
               <p className="text-sm font-bold leading-snug">{globalMessage.text}</p>
            </div>
            <button onClick={() => setGlobalMessage(null)} className="p-1 hover:bg-black/5 rounded-lg transition-all">
              <X className="w-4 h-4 opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LandingPage />
    </QueryClientProvider>
  );
}
