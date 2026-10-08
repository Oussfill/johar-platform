import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-md' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.5)] p-4 md:p-6 w-full ${sizeClass} max-h-[90vh] overflow-y-auto mx-4`}>
        <div className="flex items-center justify-between mb-6 border-b border-johar-gray-dark pb-4">
          <h3 className="text-xl font-bold text-johar-gold">{title}</h3>
          <button onClick={onClose} className="text-johar-gray-light hover:text-white p-1 rounded-lg hover:bg-johar-black-lighter transition-colors" title={t('close', 'إغلاق')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

