import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';

interface OwnershipDashboardProps {
  language: 'AR' | 'FR' | 'EN';
  currency: 'DZD' | 'EUR' | 'USD';
}

interface EscrowData {
  escrowCode: string;
  holdAmount: number;
  currency: string;
  platformFee: number;
  netAmount: number;
  status: 'HOLD' | 'HELD' | 'RELEASED';
  heldAt: string;
  releasedAt?: string;
  expiresAt: string;
}

interface OwnershipProcess {
  processId: string;
  assetGoldId: string;
  salePrice: number;
  currency: string;
  status: 'REQUESTED' | 'NOTARY_CERTIFIED' | 'KEY_ISSUED' | 'PASSPORT_ACTIVATED' | 'REJECTED';
  currentStep: 1 | 2 | 3 | 4;
  createdAt: string;
  notarizedAt?: string;
  keyIssuedAt?: string;
  activatedAt?: string;
  rejectionReason?: string;
  key?: string;
  buyerId: string;
  sellerId: string;
  escrow?: EscrowData;
}

const translations = {
  AR: {
    title: 'مسار التمليك',
    step1: 'طلب الشراء',
    step2: 'توثيق العدل',
    step3: 'إصدار المفتاح',
    step4: 'تفعيل السجل',
    step1Desc: 'تقديم طلب شراء',
    step2Desc: 'توثيق كاتب العدل',
    step3Desc: 'إصدار المفتاح الحصري',
    step4Desc: 'تفعيل السجل الرقمي',
    processInfo: 'معلومات العملية',
    processId: 'رقم العملية',
    assetId: 'رقم الأصل',
    salePrice: 'سعر البيع',
    status: 'الحالة',
    createdAt: 'تاريخ الإنشاء',
    notarizedAt: 'تاريخ التوثيق',
    keyIssuedAt: 'تاريخ إصدار المفتاح',
    activatedAt: 'تاريخ التفعيل',
    myProcesses: 'عملياتي',
    createRequest: 'طلب اقتناء أصل',
    enterAssetId: 'أدخل رقم الأصل',
    enterPrice: 'أدخل سعر البيع',
    currency: 'العملة',
    submitRequest: 'إرسال الطلب',
    enterKey: 'أدخل المفتاح الحصري',
    activate: 'تفعيل السجل الرقمي',
    viewDetails: 'عرض التفاصيل',
    statusRequested: 'قيد المراجعة',
    statusNotaryCertified: 'موثق من العدل',
    statusKeyIssued: 'تم إصدار المفتاح',
    statusPassportActivated: 'تم التفعيل',
    statusRejected: 'مرفوض',
    loading: 'جاري التحميل...',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ',
    noProcesses: 'لا توجد عمليات',
    back: 'رجوع',
    details: 'التفاصيل',
    keyPlaceholder: 'أدخل المفتاح هنا...',
    verifying: 'جاري التحقق...',
    activateSuccess: 'تم تفعيل السجل الرقمي بنجاح',
    invalidKey: 'المفتاح غير صحيح',
    requestSuccess: 'تم إرسال طلب الشراء بنجاح',
    requestFailed: 'فشل في إرسال الطلب',
    auditorOverview: 'نظرة المراقب',
    currentStep: 'الخطوة الحالية',
    priceLabel: 'السعر',
    escrowStatus: 'حالة الضمان المالي',
    holdAmount: 'المبلغ المحجوز',
    platformFee: 'رسوم المنصة',
    netToSeller: 'صافي المبلغ للبائع',
    heldAt: 'تاريخ الحجز',
    releasedAt: 'تاريخ التحرير',
    expiresAt: 'تاريخ الانتهاء',
    hold: 'محجوز',
    held: 'مؤكد',
    released: 'محرر',
    escrowCode: 'كود الضمان',
    moneyHold: 'تم حجز المبلغ',
    secureHold: 'المحجوز آمن',
    releasedCheck: 'تم التحرير',
  },
  FR: {
    title: 'Parcours de Transfert de Propriété',
    step1: 'Demande d\'Achat',
    step2: 'Certification Notariale',
    step3: 'Émission de Clé',
    step4: 'Activation du Passeport',
    step1Desc: 'Soumettre une demande d\'achat',
    step2Desc: 'Certification par le notaire',
    step3Desc: 'Émission de la clé exclusive',
    step4Desc: 'Activation du passeport numérique',
    processInfo: 'Informations du Processus',
    processId: 'ID du Processus',
    assetId: 'ID de l\'Actif',
    salePrice: 'Prix de Vente',
    status: 'Statut',
    createdAt: 'Date de Création',
    notarizedAt: 'Date de Certification',
    keyIssuedAt: 'Date d\'Émission de Clé',
    activatedAt: 'Date d\'Activation',
    myProcesses: 'Mes Processus',
    createRequest: 'Demander un Actif',
    enterAssetId: 'Entrez l\'ID de l\'actif',
    enterPrice: 'Entrez le prix de vente',
    currency: 'Devise',
    submitRequest: 'Soumettre la Demande',
    enterKey: 'Entrez la clé exclusive',
    activate: 'Activer le Passeport Numérique',
    viewDetails: 'Voir les Détails',
    statusRequested: 'En Cours d\'Examen',
    statusNotaryCertified: 'Certifié Notarialement',
    statusKeyIssued: 'Clé Émise',
    statusPassportActivated: 'Activé',
    statusRejected: 'Rejeté',
    loading: 'Chargement...',
    success: 'Opération réussie',
    error: 'Une erreur s\'est produite',
    noProcesses: 'Aucun processus',
    back: 'Retour',
    details: 'Détails',
    keyPlaceholder: 'Entrez la clé ici...',
    verifying: 'Vérification...',
    activateSuccess: 'Passeport numérique activé avec succès',
    invalidKey: 'Clé invalide',
    requestSuccess: 'Demande d\'achat soumise avec succès',
    requestFailed: 'Échec de la soumission',
    auditorOverview: 'Vue de l\'Auditeur',
    currentStep: 'Étape Actuelle',
    priceLabel: 'Prix',
    escrowStatus: 'Statut de Séquestre',
    holdAmount: 'Montant Bloqué',
    platformFee: 'Frais de Plateforme',
    netToSeller: 'Net au Vendeur',
    heldAt: 'Date de Blocage',
    releasedAt: 'Date de Libération',
    expiresAt: 'Date d\'Expiration',
    hold: 'Bloqué',
    held: 'Confirmé',
    released: 'Libéré',
    escrowCode: 'Code Séquestre',
    moneyHold: 'Montant Bloqué',
    secureHold: 'Blocage Sécurisé',
    releasedCheck: 'Libéré',
  },
  EN: {
    title: 'Ownership Transfer Path',
    step1: 'Purchase Request',
    step2: 'Notary Certification',
    step3: 'Key Issuance',
    step4: 'Passport Activation',
    step1Desc: 'Submit purchase request',
    step2Desc: 'Notary certification',
    step3Desc: 'Issue exclusive key',
    step4Desc: 'Activate digital passport',
    processInfo: 'Process Information',
    processId: 'Process ID',
    assetId: 'Asset ID',
    salePrice: 'Sale Price',
    status: 'Status',
    createdAt: 'Created At',
    notarizedAt: 'Notarized At',
    keyIssuedAt: 'Key Issued At',
    activatedAt: 'Activated At',
    myProcesses: 'My Processes',
    createRequest: 'Request Asset Acquisition',
    enterAssetId: 'Enter Asset ID',
    enterPrice: 'Enter Sale Price',
    currency: 'Currency',
    submitRequest: 'Submit Request',
    enterKey: 'Enter Exclusive Key',
    activate: 'Activate Digital Passport',
    viewDetails: 'View Details',
    statusRequested: 'Under Review',
    statusNotaryCertified: 'Notary Certified',
    statusKeyIssued: 'Key Issued',
    statusPassportActivated: 'Activated',
    statusRejected: 'Rejected',
    loading: 'Loading...',
    success: 'Operation Successful',
    error: 'An Error Occurred',
    noProcesses: 'No Processes',
    back: 'Back',
    details: 'Details',
    keyPlaceholder: 'Enter key here...',
    verifying: 'Verifying...',
    activateSuccess: 'Digital passport activated successfully',
    invalidKey: 'Invalid key',
    requestSuccess: 'Purchase request submitted successfully',
    requestFailed: 'Failed to submit request',
    auditorOverview: 'Auditor Overview',
    currentStep: 'Current Step',
    priceLabel: 'Price',
    escrowStatus: 'Escrow Status',
    holdAmount: 'Hold Amount',
    platformFee: 'Platform Fee',
    netToSeller: 'Net to Seller',
    heldAt: 'Held At',
    releasedAt: 'Released At',
    expiresAt: 'Expires At',
    hold: 'HOLD',
    held: 'HELD',
    released: 'RELEASED',
    escrowCode: 'Escrow Code',
    moneyHold: 'Amount Held',
    secureHold: 'Hold Secured',
    releasedCheck: 'Released',
  },
};

const styles = {
  container: {
    backgroundColor: '#0a0a0f',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#ffffff',
    direction: 'rtl' as const,
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '0 8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
  },
  goldText: {
    color: '#d4af37',
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '40px',
    padding: '24px',
    backgroundColor: '#12121a',
    borderRadius: '12px',
    border: '1px solid #2a2a3a',
  },
  stepContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
  },
  step: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    position: 'relative' as const,
  },
  stepCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    border: '2px solid #2a2a3a',
    backgroundColor: '#1a1a2e',
    color: '#a0a0b0',
  },
  stepCircleActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
    color: '#0a0a0f',
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
  },
  stepCircleCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
    color: '#ffffff',
  },
  stepLabel: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#a0a0b0',
    textAlign: 'center' as const,
    maxWidth: '100px',
  },
  stepLabelActive: {
    color: '#d4af37',
    fontWeight: 'bold',
  },
  stepLabelCompleted: {
    color: '#22c55e',
  },
  stepLine: {
    width: '80px',
    height: '2px',
    backgroundColor: '#2a2a3a',
    margin: '0 8px',
    marginBottom: '24px',
  },
  stepLineCompleted: {
    backgroundColor: '#22c55e',
  },
  stepLineActive: {
    backgroundColor: '#d4af37',
  },
  card: {
    backgroundColor: '#12121a',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #2a2a3a',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '16px',
    borderBottom: '1px solid #2a2a3a',
    paddingBottom: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #1a1a2e',
  },
  infoLabel: {
    color: '#a0a0b0',
    fontSize: '14px',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: '#a0a0b0',
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    direction: 'rtl' as const,
  },
  inputFocused: {
    borderColor: '#d4af37',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    appearance: 'none' as const,
    cursor: 'pointer',
  },
  button: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#d4af37',
    color: '#0a0a0f',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
  },
  buttonHover: {
    backgroundColor: '#e5c04a',
    transform: 'translateY(-1px)',
  },
  buttonDisabled: {
    backgroundColor: '#2a2a3a',
    color: '#a0a0b0',
    cursor: 'not-allowed',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: '#d4af37',
    border: '1px solid #d4af37',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '12px 16px',
    textAlign: 'right' as const,
    color: '#d4af37',
    fontWeight: 'bold',
    borderBottom: '2px solid #2a2a3a',
    fontSize: '14px',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #1a1a2e',
    color: '#ffffff',
    fontSize: '14px',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  trHover: {
    backgroundColor: '#1a1a2e',
  },
  keySection: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '24px',
    marginTop: '16px',
    border: '1px solid #d4af37',
  },
  keyInputRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  keyInputWrapper: {
    flex: 1,
  },
  activateBtnWrapper: {
    width: '200px',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: '500',
  },
  successMessage: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    border: '1px solid #22c55e',
  },
  errorMessage: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid #ef4444',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid transparent',
    borderTop: '2px solid #0a0a0f',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px',
    color: '#a0a0b0',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#12121a',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    border: '1px solid #2a2a3a',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  closeModal: {
    background: 'none',
    border: 'none',
    color: '#a0a0b0',
    fontSize: '24px',
    cursor: 'pointer',
  },
  timestampRow: {
    display: 'flex',
    gap: '8px',
    padding: '8px 0',
    borderBottom: '1px solid #1a1a2e',
  },
  timestampLabel: {
    color: '#a0a0b0',
    fontSize: '13px',
    minWidth: '120px',
  },
  timestampValue: {
    color: '#ffffff',
    fontSize: '13px',
  },
  escrowCard: {
    backgroundColor: '#12121a',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #2a2a3a',
  },
  escrowDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    marginLeft: '6px',
  },
  escrowIndicator: {
    fontSize: '11px',
    color: '#a0a0b0',
    marginTop: '4px',
    textAlign: 'center' as const,
  },
};

const OwnershipDashboard: React.FC<OwnershipDashboardProps> = ({ language, currency }) => {
  const t = translations[language];

  const [processes, setProcesses] = useState<OwnershipProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<OwnershipProcess | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'create'>('list');
  const [newRequest, setNewRequest] = useState({ assetId: '', price: '', currency: currency });
  const [verifying, setVerifying] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);

  const API_BASE = '/api/v1/ownership';

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${API_BASE}/my-processes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch processes');
      const data = await response.json();
      setProcesses(data.processes || []);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  const fetchProcessDetails = useCallback(async (processId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${API_BASE}/process/${processId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch process');
      const data = await response.json();
      const processData = data.process;
      const escrow = processData.escrow || null;
      setSelectedProcess({ ...processData, escrow });
      setEscrowData(escrow);
      setCurrentView('details');
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  const submitRequest = async () => {
    if (!newRequest.assetId || !newRequest.price) {
      setError(t.enterAssetId + ' / ' + t.enterPrice);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiFetch(`${API_BASE}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          assetId: newRequest.assetId,
          salePrice: parseFloat(newRequest.price),
          saleCurrency: newRequest.currency,
        }),
      });
      if (!response.ok) {
        let serverMessage: string | null = null;
        try {
          const errJson = await response.json();
          serverMessage = errJson?.error?.message ?? null;
        } catch {}
        throw new Error(serverMessage || t.requestFailed);
      }
      const data = await response.json();
      setSuccess(t.requestSuccess);
      setNewRequest({ assetId: '', price: '', currency: currency });
      fetchProcesses();
      setTimeout(() => {
        setCurrentView('list');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const activatePassport = async () => {
    if (!keyInput || !selectedProcess) return;
    setVerifying(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiFetch(`${API_BASE}/activate-passport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          processId: selectedProcess.processId,
          key: keyInput,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || t.invalidKey);
      }
      setSuccess(t.activateSuccess);
      setKeyInput('');
      fetchProcessDetails(selectedProcess.processId);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return '#f59e0b';
      case 'NOTARY_CERTIFIED': return '#3b82f6';
      case 'KEY_ISSUED': return '#8b5cf6';
      case 'PASSPORT_ACTIVATED': return '#22c55e';
      case 'REJECTED': return '#ef4444';
      default: return '#a0a0b0';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REQUESTED': return t.statusRequested;
      case 'NOTARY_CERTIFIED': return t.statusNotaryCertified;
      case 'KEY_ISSUED': return t.statusKeyIssued;
      case 'PASSPORT_ACTIVATED': return t.statusPassportActivated;
      case 'REJECTED': return t.statusRejected;
      default: return status;
    }
  };

  const getStepStatus = (step: number, process: OwnershipProcess | null) => {
    if (!process) return 'pending';
    const currentStep = process.currentStep;
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(language === 'AR' ? 'ar-SA' : language === 'FR' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCircleStyle = (stepStatus: string) => {
    switch (stepStatus) {
      case 'active': return { ...styles.stepCircle, ...styles.stepCircleActive };
      case 'completed': return { ...styles.stepCircle, ...styles.stepCircleCompleted };
      default: return styles.stepCircle;
    }
  };

  const getLineStyle = (stepStatus: string) => {
    if (stepStatus === 'completed') return { ...styles.stepLine, ...styles.stepLineCompleted };
    if (stepStatus === 'active') return { ...styles.stepLine, ...styles.stepLineActive };
    return styles.stepLine;
  };

  const getLabelStyle = (stepStatus: string) => {
    switch (stepStatus) {
      case 'active': return { ...styles.stepLabel, ...styles.stepLabelActive };
      case 'completed': return { ...styles.stepLabel, ...styles.stepLabelCompleted };
      default: return styles.stepLabel;
    }
  };

  const getEscrowStatusColor = (status: string) => {
    switch (status) {
      case 'RELEASED': return '#22c55e';
      case 'HELD': return '#3b82f6';
      case 'HOLD': return '#f59e0b';
      default: return '#a0a0b0';
    }
  };

  const getEscrowStatusLabel = (status: string) => {
    switch (status) {
      case 'HOLD': return t.hold;
      case 'HELD': return t.held;
      case 'RELEASED': return t.released;
      default: return status;
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const renderProgressBar = (process: OwnershipProcess | null) => {
    const escrowStatus = escrowData?.status;
    const steps = [
      { num: 1, label: t.step1, escrowIndicator: t.moneyHold, escrowDotColor: escrowStatus === 'HOLD' ? '#22c55e' : null },
      { num: 2, label: t.step2, escrowIndicator: t.secureHold, escrowDotColor: escrowStatus === 'HELD' ? '#3b82f6' : null },
      { num: 3, label: t.step3, escrowIndicator: t.secureHold, escrowDotColor: escrowStatus === 'HELD' ? '#3b82f6' : null },
      { num: 4, label: t.step4, escrowIndicator: t.releasedCheck, escrowDotColor: escrowStatus === 'RELEASED' ? '#22c55e' : null },
    ];

    return (
      <div style={styles.progressBar}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          tr:hover {
            background-color: #1a1a2e !important;
          }
          button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
          }
        `}</style>
        <div style={styles.stepContainer}>
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step.num, process);
            const showEscrowDot = process && step.escrowDotColor;
            return (
              <React.Fragment key={step.num}>
                <div
                  style={styles.step}
                  onMouseEnter={() => setHoveredStep(step.num)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div
                    style={{
                      ...getCircleStyle(stepStatus),
                      transform: hoveredStep === step.num ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {stepStatus === 'completed' ? '✓' : step.num}
                  </div>
                  <span style={getLabelStyle(stepStatus)}>
                    {step.label}
                  </span>
                  {showEscrowDot && (
                    <div style={styles.escrowIndicator}>
                      {step.num === 1 && '💰 '}
                      {(step.num === 2 || step.num === 3) && '🔒 '}
                      {step.num === 4 && '✅ '}
                      <span style={{ ...styles.escrowDot, backgroundColor: step.escrowDotColor! }} />
                      {step.escrowIndicator}
                    </div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div style={getLineStyle(stepStatus)} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProcessInfo = () => {
    if (!selectedProcess) return null;

    return (
      <div style={{ ...styles.card, animation: 'fadeIn 0.3s ease' }}>
        <h3 style={styles.cardTitle}>{t.processInfo}</h3>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.processId}</span>
          <span style={styles.infoValue}>{selectedProcess.processId}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.assetId}</span>
          <span style={styles.infoValue}>{selectedProcess.assetGoldId}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.salePrice}</span>
          <span style={styles.infoValue}>
            {selectedProcess.salePrice.toLocaleString()} {selectedProcess.currency}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.status}</span>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: `${getStatusColor(selectedProcess.status)}20`,
              color: getStatusColor(selectedProcess.status),
              border: `1px solid ${getStatusColor(selectedProcess.status)}`,
            }}
          >
            {getStatusText(selectedProcess.status)}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.currentStep}</span>
          <span style={styles.infoValue}>{selectedProcess.currentStep} / 4</span>
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid #2a2a3a', paddingTop: '16px' }}>
          <h4 style={{ color: '#d4af37', fontSize: '14px', marginBottom: '12px' }}>
            {language === 'AR' ? 'التواريخ' : language === 'FR' ? 'Dates' : 'Timestamps'}
          </h4>
          <div style={styles.timestampRow}>
            <span style={styles.timestampLabel}>{t.createdAt}</span>
            <span style={styles.timestampValue}>{formatDate(selectedProcess.createdAt)}</span>
          </div>
          {selectedProcess.notarizedAt && (
            <div style={styles.timestampRow}>
              <span style={styles.timestampLabel}>{t.notarizedAt}</span>
              <span style={styles.timestampValue}>{formatDate(selectedProcess.notarizedAt)}</span>
            </div>
          )}
          {selectedProcess.keyIssuedAt && (
            <div style={styles.timestampRow}>
              <span style={styles.timestampLabel}>{t.keyIssuedAt}</span>
              <span style={styles.timestampValue}>{formatDate(selectedProcess.keyIssuedAt)}</span>
            </div>
          )}
          {selectedProcess.activatedAt && (
            <div style={styles.timestampRow}>
              <span style={styles.timestampLabel}>{t.activatedAt}</span>
              <span style={styles.timestampValue}>{formatDate(selectedProcess.activatedAt)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEscrowCard = () => {
    if (!escrowData) return null;

    return (
      <div style={{ ...styles.escrowCard, animation: 'fadeIn 0.3s ease' }}>
        <h3 style={styles.cardTitle}>{t.escrowStatus}</h3>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.escrowCode}</span>
          <span style={styles.infoValue}>{escrowData.escrowCode}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.holdAmount}</span>
          <span style={styles.infoValue}>
            {escrowData.holdAmount.toLocaleString()} {escrowData.currency}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.platformFee} (2.5%)</span>
          <span style={styles.infoValue}>
            {escrowData.platformFee.toLocaleString()} {escrowData.currency}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.netToSeller}</span>
          <span style={{ ...styles.infoValue, color: '#22c55e', fontWeight: 'bold' }}>
            {escrowData.netAmount.toLocaleString()} {escrowData.currency}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.status}</span>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: `${getEscrowStatusColor(escrowData.status)}20`,
              color: getEscrowStatusColor(escrowData.status),
              border: `1px solid ${getEscrowStatusColor(escrowData.status)}`,
            }}
          >
            {getEscrowStatusLabel(escrowData.status)}
          </span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.heldAt}</span>
          <span style={styles.infoValue}>{formatDate(escrowData.heldAt)}</span>
        </div>
        {escrowData.releasedAt && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>{t.releasedAt}</span>
            <span style={styles.infoValue}>{formatDate(escrowData.releasedAt)}</span>
          </div>
        )}
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>{t.expiresAt}</span>
          <span style={styles.infoValue}>{formatDate(escrowData.expiresAt)}</span>
        </div>
      </div>
    );
  };

  const renderKeySection = () => {
    if (!selectedProcess || selectedProcess.status !== 'KEY_ISSUED') return null;

    return (
      <div style={styles.keySection}>
        <h4 style={{ color: '#d4af37', marginBottom: '16px', fontSize: '16px' }}>
          {t.step4} - {t.activate}
        </h4>
        <div style={styles.keyInputRow}>
          <div style={styles.keyInputWrapper}>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={t.keyPlaceholder}
              style={{
                ...styles.input,
                borderColor: keyInput ? '#d4af37' : '#2a2a3a',
              }}
              disabled={verifying}
            />
          </div>
          <div style={styles.activateBtnWrapper}>
            <button
              onClick={activatePassport}
              disabled={!keyInput || verifying}
              style={{
                ...styles.button,
                ...(verifying ? styles.buttonDisabled : {}),
              }}
            >
              {verifying ? (
                <>
                  <span style={styles.loadingSpinner}></span>
                  {t.verifying}
                </>
              ) : (
                t.activate
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateForm = () => {
    return (
      <div style={{ ...styles.card, animation: 'fadeIn 0.3s ease' }}>
        <h3 style={styles.cardTitle}>{t.createRequest}</h3>

        {error && (
          <div style={{ ...styles.message, ...styles.errorMessage }}>{error}</div>
        )}
        {success && (
          <div style={{ ...styles.message, ...styles.successMessage }}>{success}</div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>{t.assetId}</label>
          <input
            type="text"
            value={newRequest.assetId}
            onChange={(e) => setNewRequest({ ...newRequest, assetId: e.target.value })}
            placeholder={t.enterAssetId}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>{t.salePrice}</label>
          <input
            type="number"
            value={newRequest.price}
            onChange={(e) => setNewRequest({ ...newRequest, price: e.target.value })}
            placeholder={t.enterPrice}
            style={styles.input}
            min="0"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>{t.currency}</label>
          <select
            value={newRequest.currency}
            onChange={(e) => setNewRequest({ ...newRequest, currency: e.target.value as 'DZD' | 'EUR' | 'USD' })}
            style={styles.select}
          >
            <option value="DZD">DZD - دينار جزائري</option>
            <option value="EUR">EUR - يورو</option>
            <option value="USD">USD - دولار أمريكي</option>
          </select>
        </div>

        <div style={styles.actionRow}>
          <button
            onClick={() => { setCurrentView('list'); setError(null); setSuccess(null); }}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              width: 'auto',
              padding: '12px 24px',
            }}
          >
            {t.back}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={submitRequest}
            disabled={loading || !newRequest.assetId || !newRequest.price}
            style={{
              ...styles.button,
              width: 'auto',
              padding: '12px 32px',
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? (
              <>
                <span style={styles.loadingSpinner}></span>
                {t.loading}
              </>
            ) : (
              t.submitRequest
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderProcessTable = () => {
    return (
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ ...styles.cardTitle, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            {t.myProcesses}
          </h3>
          <button
            onClick={() => setCurrentView('create')}
            style={{
              ...styles.button,
              width: 'auto',
              padding: '10px 20px',
              fontSize: '14px',
            }}
          >
            + {t.createRequest}
          </button>
        </div>

        {error && (
          <div style={{ ...styles.message, ...styles.errorMessage }}>{error}</div>
        )}

        {loading ? (
          <div style={styles.emptyState}>
            <div style={{ ...styles.loadingSpinner, width: '40px', height: '40px', borderTop: '3px solid #d4af37' }}></div>
            <p style={{ marginTop: '16px', color: '#a0a0b0' }}>{t.loading}</p>
          </div>
        ) : processes.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
            <p>{t.noProcesses}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t.processId}</th>
                  <th style={styles.th}>{t.assetId}</th>
                  <th style={styles.th}>{t.priceLabel}</th>
                  <th style={styles.th}>{t.status}</th>
                  <th style={styles.th}>{t.currentStep}</th>
                  <th style={styles.th}>{t.createdAt}</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr
                    key={process.processId}
                    onClick={() => fetchProcessDetails(process.processId)}
                    style={{
                      ...styles.tr,
                      backgroundColor: hoveredRow === process.processId ? '#1a1a2e' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredRow(process.processId)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={styles.td}>
                      <span style={{ color: '#d4af37', fontWeight: '500' }}>
                        {process.processId.substring(0, 12)}...
                      </span>
                    </td>
                    <td style={styles.td}>{process.assetGoldId}</td>
                    <td style={styles.td}>
                      {process.salePrice.toLocaleString()} {process.currency}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: `${getStatusColor(process.status)}20`,
                          color: getStatusColor(process.status),
                          border: `1px solid ${getStatusColor(process.status)}`,
                        }}
                      >
                        {getStatusText(process.status)}
                      </span>
                    </td>
                    <td style={styles.td}>{process.currentStep} / 4</td>
                    <td style={styles.td}>{formatDate(process.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>
          {t.title.split(' ').map((word, i) => (
            <span key={i}>
              {i === t.title.split(' ').length - 1 ? (
                <span style={styles.goldText}>{word}</span>
              ) : (
                word
              )}{' '}
            </span>
          ))}
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
              onClick={() => { setSelectedProcess(null); setEscrowData(null); setCurrentView('list'); }}
              style={{
              ...styles.buttonSecondary,
              padding: '8px 16px',
              borderRadius: '8px',
              width: 'auto',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#d4af37',
              border: '1px solid #d4af37',
              backgroundColor: 'transparent',
            }}
          >
            {t.myProcesses}
          </button>
          <button
            onClick={() => { setSelectedProcess(null); setEscrowData(null); setCurrentView('create'); setError(null); setSuccess(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d4af37',
              backgroundColor: 'transparent',
              color: '#d4af37',
              fontSize: '14px',
              cursor: 'pointer',
              width: 'auto',
            }}
          >
            + {t.createRequest}
          </button>
        </div>
      </div>

      {currentView === 'create' && renderCreateForm()}

      {currentView === 'list' && (
        <>
          {renderProgressBar(null)}
          {renderProcessTable()}
        </>
      )}

      {currentView === 'details' && selectedProcess && (
        <>
          {renderProgressBar(selectedProcess)}
          {renderProcessInfo()}
          {renderEscrowCard()}
          {renderKeySection()}
          <div style={styles.actionRow}>
            <button
              onClick={() => { setCurrentView('list'); setSelectedProcess(null); setEscrowData(null); setError(null); setSuccess(null); }}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                width: 'auto',
                padding: '12px 24px',
              }}
            >
              {t.back}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OwnershipDashboard;
