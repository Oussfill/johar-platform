import { useState } from 'react';
import { supabase } from '../supabase';
import { QrCode, Wifi, Fingerprint, Download, Printer, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AssetIdentifiersProps {
  asset: {
    id: string;
    asset_code: string;
    nfc_uid?: string;
    fingerprint_hash?: string;
    name?: string;
  };
  onUpdate?: () => void;
}

type Tab = 'qr' | 'nfc' | 'fingerprint';

export default function AssetIdentifiers({ asset, onUpdate }: AssetIdentifiersProps) {
  const [activeTab, setActiveTab] = useState<Tab>('qr');
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'reading' | 'writing' | 'success' | 'error'>('idle');
  const [nfcMessage, setNfcMessage] = useState('');
  const [nfcUidInput, setNfcUidInput] = useState(asset.nfc_uid || '');
  const [fingerprintInput, setFingerprintInput] = useState(asset.fingerprint_hash || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const verifyUrl = `https://johar.com/verify/${asset.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verifyUrl)}&color=D4AF37&bgcolor=0a0a0a`;

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(verifyUrl)}`;
    link.download = `QR-${asset.asset_code}.png`;
    link.target = '_blank';
    link.click();
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><body style="text-align:center;font-family:monospace;padding:40px;">
        <h2>JOHAR Asset</h2>
        <p style="font-size:18px;font-weight:bold;">${asset.asset_code}</p>
        ${asset.name ? `<p>${asset.name}</p>` : ''}
        <img src="${qrImageUrl}" style="width:300px;height:300px;" />
        <p style="font-size:12px;color:#888;">${verifyUrl}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleNfcRead = async () => {
    if (!('NDEFReader' in window)) {
      setNfcStatus('error');
      setNfcMessage('NFC غير مدعوم في هذا المتصفح. يرجى استخدام Chrome على Android.');
      return;
    }
    try {
      setNfcStatus('reading');
      setNfcMessage('ضع البطاقة أو الجهاز NFC بالقرب من الشاشة...');
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      ndef.onreading = (event: any) => {
        const uid = event.serialNumber;
        setNfcUidInput(uid);
        setNfcStatus('success');
        setNfcMessage(`تم قراءة NFC UID: ${uid}`);
      };
    } catch (err: any) {
      setNfcStatus('error');
      setNfcMessage('خطأ في قراءة NFC: ' + (err?.message || 'غير معروف'));
    }
  };

  const handleNfcWrite = async () => {
    if (!('NDEFReader' in window)) {
      setNfcStatus('error');
      setNfcMessage('NFC غير مدعوم في هذا المتصفح. يرجى استخدام Chrome على Android.');
      return;
    }
    try {
      setNfcStatus('writing');
      setNfcMessage('ضع البطاقة NFC بالقرب من الشاشة للكتابة...');
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: verifyUrl }]
      });
      setNfcStatus('success');
      setNfcMessage('تم كتابة رابط التحقق على NFC بنجاح!');
    } catch (err: any) {
      setNfcStatus('error');
      setNfcMessage('خطأ في كتابة NFC: ' + (err?.message || 'غير معروف'));
    }
  };

  const handleSaveNfc = async () => {
    setSaving(true);
    const { error } = await supabase.from('assets').update({ nfc_uid: nfcUidInput }).eq('id', asset.id);
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onUpdate?.();
    } else {
      alert('خطأ في الحفظ: ' + error.message);
    }
  };

  const handleSaveFingerprint = async () => {
    setSaving(true);
    const { error } = await supabase.from('assets').update({ fingerprint_hash: fingerprintInput }).eq('id', asset.id);
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onUpdate?.();
    } else {
      alert('خطأ في الحفظ: ' + error.message);
    }
  };

  const generateFingerprintHash = () => {
    const hash = 'FP-' + Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('').toUpperCase();
    setFingerprintInput(hash);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'qr', label: 'QR Code', icon: <QrCode className="w-4 h-4" /> },
    { id: 'nfc', label: 'NFC', icon: <Wifi className="w-4 h-4" /> },
    { id: 'fingerprint', label: 'بصمة الأصل', icon: <Fingerprint className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-johar-gray-dark pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-johar-gold text-johar-gold bg-johar-gold/5'
                : 'border-transparent text-johar-gray-light hover:text-johar-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* QR Code Tab */}
      {activeTab === 'qr' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="border-2 border-johar-gold/30 rounded-xl p-4 bg-white shadow-lg shadow-johar-gold/10">
              <img
                src={qrImageUrl}
                alt={`QR Code - ${asset.asset_code}`}
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="text-center">
              <p className="font-mono text-johar-gold font-bold text-lg">{asset.asset_code}</p>
              <p className="text-xs text-johar-gray-light mt-1 break-all max-w-xs">{verifyUrl}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={handleDownloadQR} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              تحميل PNG
            </button>
            <button onClick={handlePrintQR} className="btn-secondary flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" />
              طباعة
            </button>
          </div>
          <div className="bg-johar-black/50 border border-johar-gray-dark/30 rounded-lg p-3">
            <p className="text-xs text-johar-gray-light">
              <span className="text-johar-gold font-semibold">رابط التحقق: </span>
              <span className="font-mono break-all">{verifyUrl}</span>
            </p>
          </div>
        </div>
      )}

      {/* NFC Tab */}
      {activeTab === 'nfc' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
            'NDEFReader' in window
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}>
            {'NDEFReader' in window
              ? <CheckCircle className="w-5 h-5 shrink-0" />
              : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{'NDEFReader' in window
              ? 'NFC مدعوم في هذا الجهاز'
              : 'NFC غير مدعوم هنا. استخدم Chrome على Android، أو أدخل الـ UID يدوياً أدناه.'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">UID الحالي المحفوظ</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nfcUidInput}
                  onChange={e => setNfcUidInput(e.target.value)}
                  className="input flex-1 font-mono text-sm"
                  placeholder="أدخل NFC UID يدوياً مثال: 04:A3:2B:..."
                />
                <button
                  onClick={handleSaveNfc}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : null}
                  حفظ
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleNfcRead}
                disabled={nfcStatus === 'reading'}
                className="btn-secondary flex items-center gap-2 text-sm flex-1"
              >
                {nfcStatus === 'reading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                قراءة NFC
              </button>
              <button
                onClick={handleNfcWrite}
                disabled={nfcStatus === 'writing'}
                className="btn-secondary flex items-center gap-2 text-sm flex-1"
              >
                {nfcStatus === 'writing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                كتابة على NFC
              </button>
            </div>

            {nfcMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                nfcStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : nfcStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
              }`}>
                {nfcMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fingerprint Tab */}
      {activeTab === 'fingerprint' && (
        <div className="space-y-4">
          <div className="bg-johar-black/50 border border-johar-gray-dark/30 rounded-lg p-4 text-sm text-johar-gray-light">
            <p className="flex items-start gap-2">
              <Fingerprint className="w-5 h-5 text-johar-gold shrink-0 mt-0.5" />
              <span>
                بصمة الأصل هي معرّف فريد مشتق من خصائص الأصل المادي (الخدوش، النمط، الشكل). 
                يُستخدم للتحقق من هوية الأصل عند الفحص الجسدي.
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">هاش البصمة (Fingerprint Hash)</label>
            <textarea
              value={fingerprintInput}
              onChange={e => setFingerprintInput(e.target.value)}
              rows={3}
              className="input w-full font-mono text-xs resize-none"
              placeholder="FP-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateFingerprintHash}
              className="btn-secondary text-sm flex-1 flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-4 h-4" />
              توليد هاش جديد
            </button>
            <button
              onClick={handleSaveFingerprint}
              disabled={saving}
              className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : null}
              حفظ البصمة
            </button>
          </div>

          {asset.fingerprint_hash && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">بصمة مسجّلة مسبقاً لهذا الأصل</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
