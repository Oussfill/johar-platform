// ============================================================================
// JOHAR PLATFORM — ADMIN NFC MANAGEMENT PAGE
// ============================================================================
// صفحة إدارة تقنية NFC — قراءة البطاقات، الكتابة عليها، قفلها نهائيًا
// تستخدم Web NFC API (Chrome/Android) للتفاعل مع قارئ البطاقات مباشرة
// مع fallback لطريقة الإدخال اليدوي إذا لم يكن المتصفح يدعم NFC

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PageShell, StatCard, Card, GoldButton, TextField, Loading, ErrorBox,
  Badge, DataTable, Td, Empty, fmtDateTime,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';
import { apiFetch } from '../utils/apiFetch';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NfcStats {
  totalCards: number;
  linkedToAssets: number;
  lockedCards: number;
  tamperedCards: number;
  unlinkedCards: number;
  unlockedCards: number;
}

interface NfcCard {
  id: string;
  goldId: string;
  serialNumber: string;
  metalType: string;
  karat: number | null;
  productType: string;
  weightGross: string;
  nfcUid: string | null;
  nfcUidHashPreview: string | null;
  isLinked: boolean;
  lockStatus: string;
  lockedAt: string | null;
  assetName: string;
  qrCodeHash: string | null;
  assetStatus: string;
  createdAt: string;
}

interface ReadCardData {
  uid: string;
  goldId: string;
  serialNumber: string;
  metalType: string;
  karat: number | null;
  productType: string;
  weightGross: string;
  weightNet: string;
  measuredPurity: string | null;
  assetStatus: string;
  nfcLockStatus: string;
  integrityCheck: string;
  assetName: string;
  lastAssay: { reportNumber: string; measuredPurity: string; labName: string } | null;
}

interface HistoryOp {
  id: string;
  action: string;
  description: string;
  severity: string;
  user: string;
  timestamp: string;
}

// ─── Translations ────────────────────────────────────────────────────────────

const T: Record<Language, Record<string, string>> = {
  AR: {
    title: 'إدارة بطاقات NFC',
    subtitle: 'قراءة وكتابة وقفل بطاقات NFC للتحقق الفوري من الأصول',
    tabRead: 'قراءة بطاقة',
    tabWrite: 'كتابة على بطاقة',
    tabCards: 'البطاقات المسجلة',
    // Stats
    statTotal: 'إجمالي البطاقات',
    statLinked: 'مرتبطة بأصول',
    statLocked: 'مقفلة نهائيًا',
    statTampered: 'متلاعب بها',
    // Read
    readTitle: 'قراءة بطاقة NFC',
    readDesc: 'قرّب البطاقة من قارئ NFC أو أدخل المعرف يدويًا',
    readUid: 'معرف البطاقة (UID)',
    readBtn: 'قراءة البطاقة',
    reading: 'جاري القراءة...',
    scanMode: 'مسح تلقائي (Web NFC)',
    manualMode: 'إدخال يدوي',
    startScan: 'بدء المسح',
    stopScan: 'إيقاف المسح',
    scanning: 'قرّب البطاقة من الجهاز...',
    scanUnsupported: 'المتصفح لا يدعم Web NFC — استخدم الإدخال اليدوي',
    // Read result
    resultTitle: 'بيانات البطاقة',
    integrity: 'فحص السلامة',
    integrityPass: 'سليمة ✓',
    integrityFail: 'مخترقة ✗',
    integrityNone: 'لا يوجد هاش',
    lockStatus: 'حالة القفل',
    lastAssay: 'آخر فحص مخبري',
    notFound: 'لم يتم العثور على بطاقة بهذا المعرف',
    // Write
    writeTitle: 'الكتابة على بطاقة NFC',
    writeDesc: 'ربط بطاقة NFC بأصل مسجل في النظام',
    writeNfcUid: 'معرف البطاقة (UID)',
    writeGoldId: 'معرف الأصل (Gold ID)',
    writeOrSerial: 'أو الرقم التسلسلي',
    writeBtn: 'كتابة وربط',
    writing: 'جاري الكتابة...',
    writeSuccess: 'تمت الكتابة على البطاقة وربطها بالأصل بنجاح',
    writePayload: 'البيانات المكتوبة (NDEF)',
    verifyUrl: 'رابط التحقق',
    // Lock
    lockBtn: 'قفل نهائي',
    locking: 'جاري القفل...',
    lockConfirm: 'تحذير: القفل نهائي ولا يمكن التراجع عنه. هل أنت متأكد؟',
    lockSuccess: 'تم قفل البطاقة نهائيًا',
    alreadyLocked: 'البطاقة مقفلة بالفعل',
    // Cards tab
    cardsTitle: 'البطاقات المسجلة',
    search: 'بحث بالمعرف أو الرقم التسلسلي...',
    filterAll: 'الكل',
    filterLinked: 'مرتبطة',
    filterUnlinked: 'غير مرتبطة',
    filterLocked: 'مقفلة',
    filterTampered: 'متلاعب بها',
    colUid: 'معرف البطاقة',
    colGoldId: 'معرف الأصل',
    colMetal: 'المعدن',
    colLock: 'حالة القفل',
    colLinked: 'الربط',
    colCreated: 'تاريخ الربط',
    noCards: 'لا توجد بطاقات مسجلة',
    // History
    historyTitle: 'سجل العمليات',
    historyBtn: 'سجل',
    colAction: 'العملية',
    colUser: 'المستخدم',
    colDate: 'التاريخ',
    noHistory: 'لا توجد عمليات',
    // Actions
    actions: 'الإجراءات',
    view: 'عرض',
    error: 'حدث خطأ',
  },
  FR: {
    title: 'Gestion des cartes NFC',
    subtitle: 'Lire, écrire et verrouiller des cartes NFC',
    tabRead: 'Lire une carte',
    tabWrite: 'Écrire sur une carte',
    tabCards: 'Cartes enregistrées',
    statTotal: 'Total des cartes',
    statLinked: 'Liées aux actifs',
    statLocked: 'Verrouillées',
    statTampered: 'Falsifiées',
    readTitle: 'Lire une carte NFC',
    readDesc: 'Approchez la carte du lecteur NFC ou saisissez l\'UID manuellement',
    readUid: 'UID de la carte',
    readBtn: 'Lire la carte',
    reading: 'Lecture en cours...',
    scanMode: 'Scan automatique (Web NFC)',
    manualMode: 'Saisie manuelle',
    startScan: 'Démarrer le scan',
    stopScan: 'Arrêter le scan',
    scanning: 'Approchez la carte de l\'appareil...',
    scanUnsupported: 'Web NFC non supporté — utilisez la saisie manuelle',
    resultTitle: 'Données de la carte',
    integrity: 'Contrôle d\'intégrité',
    integrityPass: 'Intacte ✓',
    integrityFail: 'Compromise ✗',
    integrityNone: 'Pas de hash',
    lockStatus: 'État du verrouillage',
    lastAssay: 'Dernière analyse',
    notFound: 'Aucune carte trouvée avec cet UID',
    writeTitle: 'Écrire sur une carte NFC',
    writeDesc: 'Lier une carte NFC à un actif enregistré',
    writeNfcUid: 'UID de la carte',
    writeGoldId: 'Gold ID de l\'actif',
    writeOrSerial: 'ou numéro de série',
    writeBtn: 'Écrire et lier',
    writing: 'Écriture en cours...',
    writeSuccess: 'Carte écrite et liée à l\'actif avec succès',
    writePayload: 'Données écrites (NDEF)',
    verifyUrl: 'URL de vérification',
    lockBtn: 'Verrouiller définitivement',
    locking: 'Verrouillage...',
    lockConfirm: 'AVERTISSEMENT: Le verrouillage est définitif. Confirmer?',
    lockSuccess: 'Carte verrouillée définitivement',
    alreadyLocked: 'Carte déjà verrouillée',
    cardsTitle: 'Cartes enregistrées',
    search: 'Rechercher par UID ou numéro de série...',
    filterAll: 'Toutes',
    filterLinked: 'Liées',
    filterUnlinked: 'Non liées',
    filterLocked: 'Verrouillées',
    filterTampered: 'Falsifiées',
    colUid: 'UID',
    colGoldId: 'Gold ID',
    colMetal: 'Métal',
    colLock: 'Verrouillage',
    colLinked: 'Liaison',
    colCreated: 'Date de liaison',
    noCards: 'Aucune carte enregistrée',
    historyTitle: 'Historique des opérations',
    historyBtn: 'Historique',
    colAction: 'Action',
    colUser: 'Utilisateur',
    colDate: 'Date',
    noHistory: 'Aucune opération',
    actions: 'Actions',
    view: 'Voir',
    error: 'Une erreur est survenue',
  },
  EN: {
    title: 'NFC Card Management',
    subtitle: 'Read, write, and lock NFC cards for instant asset verification',
    tabRead: 'Read Card',
    tabWrite: 'Write Card',
    tabCards: 'Registered Cards',
    statTotal: 'Total Cards',
    statLinked: 'Linked to Assets',
    statLocked: 'Permanently Locked',
    statTampered: 'Tampered',
    readTitle: 'Read NFC Card',
    readDesc: 'Tap the card on an NFC reader or enter the UID manually',
    readUid: 'Card UID',
    readBtn: 'Read Card',
    reading: 'Reading...',
    scanMode: 'Auto Scan (Web NFC)',
    manualMode: 'Manual Input',
    startScan: 'Start Scan',
    stopScan: 'Stop Scan',
    scanning: 'Tap the card on the device...',
    scanUnsupported: 'Web NFC not supported — use manual input',
    resultTitle: 'Card Data',
    integrity: 'Integrity Check',
    integrityPass: 'Intact ✓',
    integrityFail: 'Compromised ✗',
    integrityNone: 'No hash',
    lockStatus: 'Lock Status',
    lastAssay: 'Last Assay',
    notFound: 'No card found with this UID',
    writeTitle: 'Write to NFC Card',
    writeDesc: 'Link an NFC card to a registered asset',
    writeNfcUid: 'Card UID',
    writeGoldId: 'Asset Gold ID',
    writeOrSerial: 'or Serial Number',
    writeBtn: 'Write & Link',
    writing: 'Writing...',
    writeSuccess: 'Card written and linked to asset successfully',
    writePayload: 'Written Data (NDEF)',
    verifyUrl: 'Verify URL',
    lockBtn: 'Lock Permanently',
    locking: 'Locking...',
    lockConfirm: 'WARNING: Locking is permanent and irreversible. Are you sure?',
    lockSuccess: 'Card permanently locked',
    alreadyLocked: 'Card already locked',
    cardsTitle: 'Registered Cards',
    search: 'Search by UID or serial number...',
    filterAll: 'All',
    filterLinked: 'Linked',
    filterUnlinked: 'Unlinked',
    filterLocked: 'Locked',
    filterTampered: 'Tampered',
    colUid: 'UID',
    colGoldId: 'Gold ID',
    colMetal: 'Metal',
    colLock: 'Lock',
    colLinked: 'Linked',
    colCreated: 'Linked At',
    noCards: 'No cards registered',
    historyTitle: 'Operation History',
    historyBtn: 'History',
    colAction: 'Action',
    colUser: 'User',
    colDate: 'Date',
    noHistory: 'No operations',
    actions: 'Actions',
    view: 'View',
    error: 'An error occurred',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminNfcPage({ language, currency }: { language: Language; currency: Currency }) {
  const t = T[language];
  const dir = language === 'AR' ? 'rtl' : 'ltr';

  // ─── State: stats ───
  const [stats, setStats] = useState<NfcStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // ─── State: tabs ───
  const [activeTab, setActiveTab] = useState<'read' | 'write' | 'cards'>('read');

  // ─── State: read mode ───
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('manual');
  const [scanning, setScanning] = useState(false);
  const [readUid, setReadUid] = useState('');
  const [reading, setReading] = useState(false);
  const [readResult, setReadResult] = useState<ReadCardData | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  // ─── State: write mode ───
  const [writeForm, setWriteForm] = useState({ nfcUid: '', goldId: '', serialNumber: '' });
  const [writing, setWriting] = useState(false);
  const [writeResult, setWriteResult] = useState<{
    nfcUid: string; goldId: string; ndefPayload: string; verifyUrl: string; message: string;
  } | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  // ─── State: cards tab ───
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState<NfcCard | null>(null);

  // ─── State: history ───
  const [history, setHistory] = useState<HistoryOp[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── NFC scan support ───
  const nfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;
  const ndefRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Load stats ───
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await apiFetch('/api/v1/admin/nfc/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        setStatsError(json.error?.message || t.error);
      }
    } catch {
      setStatsError(t.error);
    }
    setStatsLoading(false);
  }, [t.error]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ─── Load cards ───
  const loadCards = useCallback(async () => {
    setCardsLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (search) params.set('search', search);
      const res = await apiFetch(`/api/v1/admin/nfc/cards?${params}`);
      const json = await res.json();
      if (json.success) {
        setCards(json.data.items || []);
      }
    } catch {
      // silent
    }
    setCardsLoading(false);
  }, [filter, search]);

  useEffect(() => {
    if (activeTab === 'cards') {
      const timeout = setTimeout(() => loadCards(), search ? 400 : 0);
      return () => clearTimeout(timeout);
    }
  }, [activeTab, loadCards, search]);

  // ─── NFC: Start scanning (Web NFC) ───
  const startScan = useCallback(async () => {
    if (!nfcSupported) return;
    try {
      setScanning(true);
      setReadResult(null);
      setReadError(null);

      const ndef = new (window as any).NDEFReader();
      ndefRef.current = ndef;
      const abortCtrl = new AbortController();
      abortRef.current = abortCtrl;

      await ndef.scan({ signal: abortCtrl.signal });

      ndef.addEventListener('reading', async ({ serialNumber }: any) => {
        // UID قد يأتي بصيغة hex مفصولة بنقطتين — ننظفه
        const uid = (serialNumber || '').replace(/:/g, '').toUpperCase();
        if (uid) {
          setReadUid(uid);
          setScanning(false);
          abortCtrl.abort();
          await handleRead(uid);
        }
      });
    } catch (e: any) {
      setScanning(false);
      setReadError(e?.message || t.error);
    }
  }, [nfcSupported, t.error]);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    setScanning(false);
  }, []);

  // ─── Read card (manual or auto) ───
  const handleRead = useCallback(async (uid?: string) => {
    const targetUid = (uid || readUid).trim();
    if (!targetUid) return;
    setReading(true);
    setReadResult(null);
    setReadError(null);
    try {
      const res = await apiFetch(`/api/v1/admin/nfc/read/${encodeURIComponent(targetUid)}`);
      const json = await res.json();
      if (json.success) {
        setReadResult(json.data);
        // تحديث الإحصائيات
        loadStats();
      } else {
        setReadError(json.error?.message || t.notFound);
      }
    } catch {
      setReadError(t.error);
    }
    setReading(false);
  }, [readUid, t.error, t.notFound, loadStats]);

  // ─── Write card ───
  const handleWrite = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setWriting(true);
    setWriteResult(null);
    setWriteError(null);
    try {
      const payload: any = { nfcUid: writeForm.nfcUid.trim() };
      if (writeForm.goldId.trim()) payload.goldId = writeForm.goldId.trim();
      if (writeForm.serialNumber.trim()) payload.serialNumber = writeForm.serialNumber.trim();

      const res = await apiFetch('/api/v1/admin/nfc/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setWriteResult(json.data);
        setWriteForm({ nfcUid: '', goldId: '', serialNumber: '' });
        loadStats();
      } else {
        setWriteError(json.error?.message || t.error);
      }
    } catch {
      setWriteError(t.error);
    }
    setWriting(false);
  }, [writeForm, t.error, loadStats]);

  // ─── Lock card ───
  const handleLock = useCallback(async (uid: string) => {
    if (!confirm(t.lockConfirm)) return;
    try {
      const res = await apiFetch(`/api/v1/admin/nfc/lock/${encodeURIComponent(uid)}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        loadStats();
        if (activeTab === 'cards') loadCards();
        if (readResult?.uid === uid) handleRead(uid);
      } else {
        alert(json.error?.message || t.error);
      }
    } catch {
      alert(t.error);
    }
  }, [t, loadStats, loadCards, activeTab, readResult, handleRead]);

  // ─── History ───
  const loadHistory = useCallback(async (uid: string) => {
    setHistoryLoading(true);
    setSelectedCard(cards.find((c) => c.nfcUid === uid) || null);
    try {
      const res = await apiFetch(`/api/v1/admin/nfc/history/${encodeURIComponent(uid)}`);
      const json = await res.json();
      if (json.success) {
        setHistory(json.data.operations || []);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
    setHistoryLoading(false);
  }, [cards]);

  // ─── Integrity badge ───
  const integrityBadge = (check: string) => {
    if (check === 'PASS') return <Badge value={t.integrityPass} color="#3cb97e" />;
    if (check === 'FAIL') return <Badge value={t.integrityFail} color="#dc3545" />;
    return <Badge value={t.integrityNone} color="#8a8a9a" />;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <PageShell title={t.title} subtitle={t.subtitle} icon="📡" language={language}>
      {/* ─── Stats ─── */}
      {statsLoading ? (
        <Loading />
      ) : statsError ? (
        <ErrorBox message={statsError} />
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label={t.statTotal} value={stats.totalCards} icon="💳" />
          <StatCard label={t.statLinked} value={stats.linkedToAssets} icon="🔗" color="#3cb97e" />
          <StatCard label={t.statLocked} value={stats.lockedCards} icon="🔒" color="#e8a13c" />
          <StatCard label={t.statTampered} value={stats.tamperedCards} icon="⚠️" color="#dc3545" />
        </div>
      ) : null}

      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <GoldButton
          onClick={() => setActiveTab('read')}
          style={{
            flex: '1 1 130px',
            background: activeTab === 'read' ? '#c6a969' : 'transparent',
            color: activeTab === 'read' ? '#0a0a0f' : '#8a8a9a',
            border: activeTab === 'read' ? 'none' : '1px solid rgba(198,169,105,0.2)',
          }}
        >
          📖 {t.tabRead}
        </GoldButton>
        <GoldButton
          onClick={() => setActiveTab('write')}
          style={{
            flex: '1 1 130px',
            background: activeTab === 'write' ? '#c6a969' : 'transparent',
            color: activeTab === 'write' ? '#0a0a0f' : '#8a8a9a',
            border: activeTab === 'write' ? 'none' : '1px solid rgba(198,169,105,0.2)',
          }}
        >
          ✍️ {t.tabWrite}
        </GoldButton>
        <GoldButton
          onClick={() => setActiveTab('cards')}
          style={{
            flex: '1 1 130px',
            background: activeTab === 'cards' ? '#c6a969' : 'transparent',
            color: activeTab === 'cards' ? '#0a0a0f' : '#8a8a9a',
            border: activeTab === 'cards' ? 'none' : '1px solid rgba(198,169,105,0.2)',
          }}
        >
          💳 {t.tabCards}
        </GoldButton>
      </div>

      {/* ═══════ TAB: READ ═══════ */}
      {activeTab === 'read' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 20 }}>
          {/* Read input */}
          <Card title={t.readTitle}>
            <p style={{ color: '#8a8a9a', fontSize: 13, marginBottom: 16 }}>{t.readDesc}</p>

            {/* Scan mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <GoldButton
                type="button"
                onClick={() => setScanMode('auto')}
                disabled={!nfcSupported}
                style={{
                  flex: 1, padding: '8px 12px', fontSize: 12,
                  background: scanMode === 'auto' ? '#c6a969' : 'transparent',
                  color: scanMode === 'auto' ? '#0a0a0f' : '#8a8a9a',
                  opacity: nfcSupported ? 1 : 0.4,
                }}
              >
                📡 {t.scanMode}
              </GoldButton>
              <GoldButton
                type="button"
                onClick={() => { setScanMode('manual'); stopScan(); }}
                style={{
                  flex: 1, padding: '8px 12px', fontSize: 12,
                  background: scanMode === 'manual' ? '#c6a969' : 'transparent',
                  color: scanMode === 'manual' ? '#0a0a0f' : '#8a8a9a',
                }}
              >
                ⌨️ {t.manualMode}
              </GoldButton>
            </div>

            {/* Scan mode */}
            {scanMode === 'auto' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                {!scanning ? (
                  <GoldButton type="button" onClick={startScan} disabled={!nfcSupported} style={{ padding: '14px 32px', fontSize: 16 }}>
                    📡 {t.startScan}
                  </GoldButton>
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>📡</div>
                    <p style={{ color: '#c6a969', fontSize: 15, fontWeight: 700 }}>{t.scanning}</p>
                    <GoldButton type="button" onClick={stopScan} style={{ marginTop: 12, padding: '8px 24px', background: 'transparent', border: '1px solid rgba(220,53,69,0.3)', color: '#dc3545' }}>
                      ✕ {t.stopScan}
                    </GoldButton>
                  </>
                )}
              </div>
            )}

            {/* Manual mode */}
            {scanMode === 'manual' && (
              <form onSubmit={(e) => { e.preventDefault(); handleRead(); }}>
                <TextField
                  placeholder={t.readUid}
                  value={readUid}
                  onChange={(e) => setReadUid(e.target.value)}
                  style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                  required
                />
                <GoldButton type="submit" disabled={reading} style={{ marginTop: 12, width: '100%', padding: 12 }}>
                  {reading ? `⏳ ${t.reading}` : `📖 ${t.readBtn}`}
                </GoldButton>
              </form>
            )}

            {readError && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.3)', color: '#dc3545', fontSize: 13 }}>
                ⚠️ {readError}
              </div>
            )}

            {!nfcSupported && scanMode === 'auto' && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(232,161,60,0.08)', border: '1px solid rgba(232,161,60,0.3)', color: '#e8a13c', fontSize: 12 }}>
                ℹ️ {t.scanUnsupported}
              </div>
            )}
          </Card>

          {/* Read result */}
          {readResult && (
            <Card title={t.resultTitle}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#c6a969', fontSize: 17, fontWeight: 800 }}>{readResult.assetName}</div>
                  <div style={{ color: '#8a8a9a', fontSize: 12, fontFamily: 'monospace' }}>{readResult.goldId}</div>
                </div>
                {integrityBadge(readResult.integrityCheck)}
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  ['UID', readResult.uid],
                  [t.colMetal, `${readResult.metalType} ${readResult.karat || ''}K`],
                  ['Type', readResult.productType],
                  ['Weight', `${readResult.weightGross}g`],
                  [t.lockStatus, readResult.nfcLockStatus],
                  ['Status', readResult.assetStatus],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ color: '#8a8a9a', fontSize: 11 }}>{label}</div>
                    <div style={{ color: '#e0d5c1', fontSize: 13, fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Last assay */}
              {readResult.lastAssay && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(60,185,126,0.06)', border: '1px solid rgba(60,185,126,0.2)', borderRadius: 8 }}>
                  <span style={{ color: '#3cb97e', fontSize: 12, fontWeight: 700 }}>🔬 {t.lastAssay}: </span>
                  <span style={{ color: '#8a8a9a', fontSize: 12 }}>
                    {readResult.lastAssay.reportNumber} — {readResult.lastAssay.measuredPurity}% ({readResult.lastAssay.labName})
                  </span>
                </div>
              )}

              {/* Lock button */}
              {readResult.nfcLockStatus === 'UNLOCKED' && (
                <GoldButton
                  type="button"
                  onClick={() => handleLock(readResult.uid)}
                  style={{
                    marginTop: 16, width: '100%', padding: 12,
                    background: 'rgba(232,161,60,0.1)', border: '1px solid rgba(232,161,60,0.4)', color: '#e8a13c',
                  }}
                >
                  🔒 {t.lockBtn}
                </GoldButton>
              )}
              {readResult.nfcLockStatus === 'LOCKED' && (
                <div style={{ marginTop: 16, padding: 10, textAlign: 'center', background: 'rgba(60,185,126,0.08)', border: '1px solid rgba(60,185,126,0.25)', borderRadius: 8, color: '#3cb97e', fontSize: 13, fontWeight: 700 }}>
                  🔒 {t.alreadyLocked}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ═══════ TAB: WRITE ═══════ */}
      {activeTab === 'write' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 20 }}>
          <Card title={t.writeTitle}>
            <p style={{ color: '#8a8a9a', fontSize: 13, marginBottom: 16 }}>{t.writeDesc}</p>
            <form onSubmit={handleWrite}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <TextField
                  placeholder={t.writeNfcUid}
                  value={writeForm.nfcUid}
                  onChange={(e) => setWriteForm({ ...writeForm, nfcUid: e.target.value })}
                  style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                  required
                />
                <div style={{ textAlign: 'center', color: '#5a5a68', fontSize: 11 }}>— {t.writeOrSerial} —</div>
                <TextField
                  placeholder={t.writeGoldId}
                  value={writeForm.goldId}
                  onChange={(e) => setWriteForm({ ...writeForm, goldId: e.target.value })}
                  style={{ fontFamily: 'monospace' }}
                />
                <TextField
                  placeholder={t.writeOrSerial}
                  value={writeForm.serialNumber}
                  onChange={(e) => setWriteForm({ ...writeForm, serialNumber: e.target.value })}
                  style={{ fontFamily: 'monospace' }}
                />
                <GoldButton type="submit" disabled={writing} style={{ padding: 12 }}>
                  {writing ? `⏳ ${t.writing}` : `✍️ ${t.writeBtn}`}
                </GoldButton>
              </div>
            </form>

            {writeError && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.3)', color: '#dc3545', fontSize: 13 }}>
                ⚠️ {writeError}
              </div>
            )}
          </Card>

          {/* Write result */}
          {writeResult && (
            <Card title={t.writeSuccess}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <div style={{ color: '#c6a969', fontSize: 14, fontWeight: 700 }}>{writeResult.goldId}</div>
                  <div style={{ color: '#8a8a9a', fontSize: 11, fontFamily: 'monospace' }}>{writeResult.nfcUid}</div>
                </div>
              </div>
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 12 }}>
                <div style={{ color: '#8a8a9a', fontSize: 11, marginBottom: 6 }}>{t.writePayload}:</div>
                <code style={{ color: '#c6a969', fontSize: 10, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {writeResult.ndefPayload}
                </code>
              </div>
              <div style={{ padding: 12, background: 'rgba(198,169,105,0.06)', borderRadius: 8, border: '1px solid rgba(198,169,105,0.2)' }}>
                <div style={{ color: '#8a8a9a', fontSize: 11, marginBottom: 4 }}>{t.verifyUrl}:</div>
                <code style={{ color: '#c6a969', fontSize: 13 }}>{writeResult.verifyUrl}</code>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════ TAB: CARDS ═══════ */}
      {activeTab === 'cards' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <TextField
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            {['all', 'linked', 'unlinked', 'locked', 'tampered'].map((f) => (
              <GoldButton
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', fontSize: 12,
                  background: filter === f ? '#c6a969' : 'transparent',
                  color: filter === f ? '#0a0a0f' : '#8a8a9a',
                  border: filter === f ? 'none' : '1px solid rgba(198,169,105,0.2)',
                }}
              >
                {t[`filter${f.charAt(0).toUpperCase() + f.slice(1)}` as keyof typeof T.AR]}
              </GoldButton>
            ))}
          </div>

          {/* Table */}
          {cardsLoading ? (
            <Loading />
          ) : cards.length === 0 ? (
            <Empty text={t.noCards} />
          ) : (
            <DataTable
              columns={[t.colUid, t.colGoldId, t.colMetal, t.colLock, t.colLinked, t.colCreated, t.actions]}
              dir={dir}
            >
              {cards.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <code style={{ fontSize: 11 }}>{c.nfcUid}</code>
                  </Td>
                  <Td>
                    <code style={{ fontSize: 11, color: '#c6a969' }}>{c.goldId}</code>
                  </Td>
                  <Td>{c.metalType} {c.karat ? `${c.karat}K` : ''}</Td>
                  <Td>
                    <Badge
                      value={c.lockStatus}
                      color={c.lockStatus === 'LOCKED' ? '#3cb97e' : c.lockStatus === 'TAMPERED' ? '#dc3545' : '#e8a13c'}
                    />
                  </Td>
                  <Td>
                    <Badge
                      value={c.isLinked ? '✓' : '✗'}
                      color={c.isLinked ? '#3cb97e' : '#8a8a9a'}
                    />
                  </Td>
                  <Td>{fmtDateTime(c.createdAt, language)}</Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <GoldButton
                        type="button"
                        onClick={() => { setReadUid(c.nfcUid || ''); handleRead(c.nfcUid || ''); setActiveTab('read'); }}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        {t.view}
                      </GoldButton>
                      <GoldButton
                        type="button"
                        onClick={() => c.nfcUid && loadHistory(c.nfcUid)}
                        style={{ padding: '4px 10px', fontSize: 11, background: 'transparent', border: '1px solid rgba(198,169,105,0.2)' }}
                      >
                        {t.historyBtn}
                      </GoldButton>
                      {c.lockStatus === 'UNLOCKED' && c.nfcUid && (
                        <GoldButton
                          type="button"
                          onClick={() => handleLock(c.nfcUid!)}
                          style={{ padding: '4px 10px', fontSize: 11, background: 'rgba(232,161,60,0.1)', border: '1px solid rgba(232,161,60,0.3)', color: '#e8a13c' }}
                        >
                          🔒
                        </GoldButton>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </DataTable>
          )}

          {/* History modal */}
          {history !== null && (
            <div
              dir={dir}
              style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.75)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}
              onClick={() => setHistory(null)}
            >
              <div
                style={{
                  background: '#1a1a24', borderRadius: 14, maxWidth: 640, width: '100%',
                  maxHeight: '80vh', overflow: 'auto', padding: 24, border: '1px solid rgba(198,169,105,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ color: '#c6a969', fontSize: 17, fontWeight: 800, margin: 0 }}>{t.historyTitle}</h3>
                    {selectedCard && (
                      <p style={{ color: '#8a8a9a', fontSize: 11, margin: '4px 0 0', fontFamily: 'monospace' }}>
                        {selectedCard.nfcUid} — {selectedCard.goldId}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setHistory(null)} style={{ background: 'transparent', border: 'none', color: '#8a8a9a', fontSize: 24, cursor: 'pointer' }}>✕</button>
                </div>

                {historyLoading ? (
                  <Loading />
                ) : history.length === 0 ? (
                  <Empty text={t.noHistory} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {history.map((h) => (
                      <div key={h.id} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Badge
                            value={h.action}
                            color={
                              h.action.includes('LOCKED') ? '#e8a13c'
                              : h.action.includes('WRITTEN') ? '#c6a969'
                              : h.action.includes('FAIL') ? '#dc3545'
                              : '#5b8ff9'
                            }
                          />
                          <span style={{ color: '#5a5a68', fontSize: 10 }}>{fmtDateTime(h.timestamp, language)}</span>
                        </div>
                        <p style={{ color: '#c0c0d0', fontSize: 12, margin: '6px 0 2px' }}>{h.description}</p>
                        <p style={{ color: '#8a8a9a', fontSize: 10, margin: 0 }}>👤 {h.user}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>
    </PageShell>
  );
}

export default AdminNfcPage;
