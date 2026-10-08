// ============================================================================
// GOLD PLATFORM — AI ASSISTANT CHAT UI COMPONENT
// ============================================================================
// واجهة المساعد الذكي للمعادن الثمينة
// يدعم 3 لغات (AR/FR/EN) مع عرض AI Disclaimer في كل تقييم
//
// الهوية البصرية: Deep Graphite + Precious Gold

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Language = 'AR' | 'FR' | 'EN';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'error';
  analysisData?: any;
}

interface AIAssistantChatUIProps {
  language: Language;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const T: Record<string, Record<Language, string>> = {
  title: { AR: 'المساعد الذكي للمعادن الثمينة', FR: 'Assistant IA pour Métaux Précieux', EN: 'Precious Metals AI Assistant' },
  subtitle: { AR: 'اسأل عن تقييم معادنك الثمينة', FR: 'Possez une question sur vos métaux', EN: 'Ask about your precious metals' },
  placeholder: { AR: 'اكتب سؤالك هنا...', FR: 'Tapez votre question...', EN: 'Type your question...' },
  send: { AR: 'إرسال', FR: 'Envoyer', EN: 'Send' },
  disclaimer: {
    AR: 'تقييم الذكاء الاصطناعي هو مساعدة تحليلية ولا يحل محل الاختبار المختبري المطلوب قانوناً أو التقييم المهني.',
    FR: "L'évaluation par intelligence artificielle est une aide analytique et ne remplace pas les tests de laboratoire requis par la loi ni l'expertise professionnelle.",
    EN: 'AI-generated assessment is an analytical aid and does not replace legally required laboratory testing or professional appraisal.',
  },
  purity_analysis: { AR: 'تحليل النقاوة', FR: 'Analyse de pureté', EN: 'Purity Analysis' },
  value_estimation: { AR: 'تقدير القيمة', FR: 'Estimation de la valeur', EN: 'Value Estimation' },
  fraud_check: { AR: 'فحص الاحتيال', FR: 'Vérification de fraude', EN: 'Fraud Check' },
  quick_actions: { AR: 'إجراءات سريعة', FR: 'Actions rapides', EN: 'Quick Actions' },
  analyzing: { AR: 'جاري التحليل...', FR: 'Analyse en cours...', EN: 'Analyzing...' },
  metal_weight: { AR: 'وزن المعدن', FR: 'Poids du métal', EN: 'Metal Weight' },
  metal_type: { AR: 'نوع المعدن', FR: 'Type de métal', EN: 'Metal Type' },
  confidence: { AR: 'درجة الثقة', FR: 'Score de confiance', EN: 'Confidence Score' },
  estimated_value: { AR: 'القيمة المقدرة', FR: 'Valeur estimée', EN: 'Estimated Value' },
  recommendations: { AR: 'التوصيات', FR: 'Recommandations', EN: 'Recommendations' },
};

// ============================================================================
// AI ASSISTANT CHAT UI COMPONENT
// ============================================================================

export const AIAssistantChatUI: React.FC<AIAssistantChatUIProps> = ({ language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const direction = language === 'AR' ? 'rtl' : 'ltr';

  // التمرير إلى آخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // إرسال رسالة
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // محاكاة استجابة AI — في الإنتاج: يتصل بـ AI Service
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponse = generateAIResponse(inputValue.trim(), language);

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: aiResponse.text,
        timestamp: new Date(),
        type: aiResponse.hasAnalysis ? 'analysis' : 'text',
        analysisData: aiResponse.analysisData,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: language === 'AR'
          ? 'عذراً، حدث خطأ في التحليل. يرجى المحاولة مرة أخرى.'
          : language === 'FR'
          ? "Désolé, une erreur s'est produite. Veuillez réessayer."
          : 'Sorry, an error occurred during analysis. Please try again.',
        timestamp: new Date(),
        type: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, language]);

  // التعامل مع الضغط على Enter
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // الإجراءات السريعة
  const handleQuickAction = useCallback(
    (action: string) => {
      const prompts: Record<string, Record<Language, string>> = {
        purity: {
          AR: 'أريد تحليل نقاوة قطعة ذهب 22 قيراط بوزن 50 جرام',
          FR: "Je veux analyser la pureté d'une pièce d'or 22 carats de 50g",
          EN: 'I want to analyze the purity of a 22K gold piece weighing 50g',
        },
        value: {
          AR: 'ما هي القيمة السوقية لسبكة ذهب 24 قيراط بوزن 100 جرام؟',
          FR: 'Quelle est la valeur marchande d\'un lingot d\'or 24 carats de 100g?',
          EN: 'What is the market value of a 24K gold bar weighing 100g?',
        },
        fraud: {
          AR: 'أريد فحص أصالة قطعة ذهب مشبوهة',
          FR: "Je veux vérifier l'authenticité d'une pièce d'or suspecte",
          EN: 'I want to verify the authenticity of a suspicious gold piece',
        },
      };

      setInputValue(prompts[action]?.[language] || prompts.purity[language]);
      inputRef.current?.focus();
    },
    [language],
  );

  return (
    <div className="gold-ai-chat" dir={direction}>
      {/* الرأس */}
      <div className="gold-ai-chat__header">
        <div className="gold-ai-avatar">🤖</div>
        <div>
          <h3 style={{ color: 'var(--color-gold-400)', fontSize: '1rem', margin: 0 }}>
            {T.title[language]}
          </h3>
          <p style={{ color: 'var(--color-primary-300)', fontSize: '0.8rem', margin: 0 }}>
            {T.subtitle[language]}
          </p>
        </div>
      </div>

      {/* الرسائل */}
      <div className="gold-ai-chat__messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-primary-400)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 16 }}>💎</p>
            <p style={{ fontSize: '0.9rem' }}>{T.subtitle[language]}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`gold-ai-message gold-ai-message--${msg.role === 'ai' ? 'ai' : 'user'}`}
          >
            {msg.role === 'ai' && <div className="gold-ai-avatar" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>🤖</div>}
            <div className="gold-ai-message__bubble">
              {msg.content}

              {/* عرض نتائج التحليل */}
              {msg.type === 'analysis' && msg.analysisData && (
                <div style={{ marginTop: 12, padding: 12, backgroundColor: 'var(--color-primary-700)', borderRadius: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-primary-400)' }}>
                        {T.confidence[language]}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-gold-400)', fontWeight: 700 }}>
                        {(msg.analysisData.confidenceScore * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-primary-400)' }}>
                        {T.estimated_value[language]}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-gold-400)', fontWeight: 700 }}>
                        {msg.analysisData.estimatedValue}
                      </div>
                    </div>
                  </div>

                  {/* التوصيات */}
                  {msg.analysisData.recommendations && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-primary-400)', marginBottom: 4 }}>
                        {T.recommendations[language]}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--color-primary-200)' }}>
                        {msg.analysisData.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* AI Disclaimer */}
              {msg.role === 'ai' && msg.type !== 'error' && (
                <div className="gold-disclaimer" style={{ marginTop: 8, padding: 8 }}>
                  <span className="gold-disclaimer__icon" style={{ fontSize: '0.8rem' }}>ℹ</span>
                  <span className="gold-disclaimer__text" style={{ fontSize: '0.7rem' }}>
                    {T.disclaimer[language]}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="gold-ai-message gold-ai-message--ai">
            <div className="gold-ai-avatar" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>🤖</div>
            <div className="gold-ai-message__bubble">
              <div className="gold-spinner" style={{ width: 20, height: 20 }} />
              <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--color-primary-400)' }}>
                {T.analyzing[language]}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* الإجراءات السريعة */}
      <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-primary-700)', borderLeft: '1px solid var(--color-primary-500)', borderRight: '1px solid var(--color-primary-500)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-primary-400)', marginBottom: 4 }}>
          {T.quick_actions[language]}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'purity', label: T.purity_analysis[language] },
            { key: 'value', label: T.value_estimation[language] },
            { key: 'fraud', label: T.fraud_check[language] },
          ].map((action) => (
            <button
              key={action.key}
              className="gold-btn gold-btn--ghost gold-btn--sm"
              onClick={() => handleQuickAction(action.key)}
              style={{ fontSize: '0.7rem', padding: '4px 10px' }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* حقل الإدخال */}
      <div className="gold-ai-chat__input-area">
        <input
          ref={inputRef}
          type="text"
          className="gold-ai-chat__input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={T.placeholder[language]}
          disabled={isLoading}
          dir={direction}
        />
        <button
          className="gold-ai-chat__send"
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          aria-label={T.send[language]}
        >
          {direction === 'rtl' ? '←' : '→'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// AI RESPONSE GENERATOR (محاكاة)
// ============================================================================

function generateAIResponse(query: string, language: Language): {
  text: string;
  hasAnalysis: boolean;
  analysisData?: any;
} {
  const lowerQuery = query.toLowerCase();

  // تحليل النقاوة
  if (lowerQuery.includes('purity') || lowerQuery.includes('nqawa') || lowerQuery.includes('pureté') || lowerQuery.includes('نقاوة')) {
    const text = language === 'AR'
      ? 'تم تحليل قطعة الذهب بنجاح. النتيجة: نقاوة 91.67% (22 قيراط). درجة الثقة: 92.5%'
      : language === 'FR'
      ? "Analyse de pureté terminée. Résultat: 91.67% (22 carats). Score de confiance: 92,5%"
      : 'Purity analysis complete. Result: 91.67% purity (22K). Confidence: 92.5%';

    return {
      text,
      hasAnalysis: true,
      analysisData: {
        confidenceScore: 0.925,
        estimatedValue: '$3,250.00',
        recommendations: language === 'AR'
          ? [
              'يُنصح بفحص مختبري شامل للتحقق النهائي',
              'النسبة المئوية للنقاوة متوافقة مع 22 قيراط',
              'يمكن المتابعة مع شهادة مختبر معتمد (ISO 17025)',
            ]
          : language === 'FR'
          ? [
              'Une analyse de laboratoire complète est recommandée',
              'Le pourcentage de pureté est compatible avec 22 carats',
              'Consultez un certificat de laboratoire accrédité (ISO 17025)',
            ]
          : [
              'Comprehensive laboratory analysis recommended',
              'Purity percentage is consistent with 22K',
              'Consult ISO 17025 accredited laboratory certificate',
            ],
      },
    };
  }

  // تقدير القيمة
  if (lowerQuery.includes('value') || lowerQuery.includes('price') || lowerQuery.includes('قيمة') || lowerQuery.includes('valeur')) {
    const text = language === 'AR'
      ? 'تقدير القيمة: سبكة ذهب 24 قيراط بوزن 100 جرام = $6,550.00 (بناءً على سعر الذهب المرجعي الحالي)'
      : language === 'FR'
      ? "Estimation de la valeur: Lingot d'or 24 carats de 100g = 6 550,00 $ (basé sur le prix de référence actuel)"
      : 'Value Estimation: 24K Gold Bar 100g = $6,550.00 (based on current reference gold price)';

    return {
      text,
      hasAnalysis: true,
      analysisData: {
        confidenceScore: 0.88,
        estimatedValue: '$6,550.00',
        recommendations: language === 'AR'
          ? [
              'السعر مبني على سعر الذهب المرجعي اللحظي',
              'القيمة لا تشمل تكاليف التصنيع والشحن والتأمين',
              'يُنصح بعرض سعر من مزود خدمة محلي'
            ]
          : language === 'FR'
          ? [
              'Le prix est basé sur le prix de référence de l\'or en temps réel',
              'La valeur n\'inclut pas les coûts de fabrication, d\'expédition et d\'assurance',
              'Obtenez un devis auprès d\'un fournisseur local'
            ]
          : [
              'Price based on real-time reference gold price',
              'Value does not include manufacturing, shipping, and insurance costs',
              'Get a quote from a local service provider'
            ],
      },
    };
  }

  // فحص الاحتيال
  if (lowerQuery.includes('fraud') || lowerQuery.includes('fake') || lowerQuery.includes('احتيال') || lowerQuery.includes('fraude')) {
    const text = language === 'AR'
      ? 'تم فحص الأصالة: لا توجد علامات احتيال مكتشفة. درجة الخطورة: منخفضة (0.12/1.0)'
      : language === 'FR'
      ? "Vérification d'authenticité: Aucune fraude détectée. Niveau de risque: Faible (0,12/1,0)"
      : 'Authenticity Check: No fraud detected. Risk Level: Low (0.12/1.0)';

    return {
      text,
      hasAnalysis: true,
      analysisData: {
        confidenceScore: 0.88,
        estimatedValue: 'Low Risk',
        recommendations: language === 'AR'
          ? [
              'لا توجد شذوذات في الرقم التسلسلي',
              'الوزن متوافق مع المواصفات',
              'سلسلة الحيازة سليمة ومتسقة'
            ]
          : language === 'FR'
          ? [
              'Aucune anomalie de numéro de série',
              'Le poids est conforme aux spécifications',
              'La chaîne de possession est intacte et cohérente'
            ]
          : [
              'No serial number anomalies',
              'Weight is consistent with specifications',
              'Chain of custody is intact and consistent'
            ],
      },
    };
  }

  // استجابة افتراضية
  const defaultText = language === 'AR'
    ? 'يمكنني مساعدتك في تحليل النقاوة، تقدير القيمة، أو فحص الأصالة. يرجى تحديد ما تريد تحليله.'
    : language === 'FR'
    ? 'Je peux vous aider à analyser la pureté, estimer la valeur ou vérifier l\'authenticité. Veuillez préciser votre demande.'
    : 'I can help you analyze purity, estimate value, or verify authenticity. Please specify what you\'d like to analyze.';

  return {
    text: defaultText,
    hasAnalysis: false,
  };
}

export default AIAssistantChatUI;
