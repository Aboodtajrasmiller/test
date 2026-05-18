import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../lib/translation-utils';
import { Globe, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface TranslatableContentProps {
  content: string;
  className?: string;
  autoTranslate?: boolean;
}

export function TranslatableContent({ content, className, autoTranslate = false }: TranslatableContentProps) {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(content);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const targetLang = i18n.language === 'ar' ? 'Arabic' : 'English';
  const isOriginalArabic = /[\u0600-\u06FF]/.test(content);
  const needsTranslation = (isOriginalArabic && i18n.language !== 'ar') || (!isOriginalArabic && i18n.language === 'ar');

  useEffect(() => {
    if (autoTranslate && needsTranslation && content) {
      handleTranslate();
    } else {
      setTranslatedText(content);
    }
  }, [content, i18n.language, autoTranslate]);

  const handleTranslate = async () => {
    if (!content) return;
    setLoading(true);
    const result = await translateText(content, targetLang);
    setTranslatedText(result);
    setLoading(false);
  };

  return (
    <div className={cn("group relative", className)}>
      <div className={cn("transition-opacity", loading ? "opacity-50" : "opacity-100")}>
        {showOriginal ? content : translatedText}
      </div>
      
      {needsTranslation && (
        <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-[10px] font-bold text-blue-500 hover:underline"
          >
            {showOriginal ? "عرض الترجمة" : "عرض الأصل"}
          </button>
          
          {!autoTranslate && !showOriginal && translatedText === content && (
            <button 
              onClick={handleTranslate}
              disabled={loading}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors"
            >
              {loading ? <RefreshCw size={10} className="animate-spin" /> : <Globe size={10} />}
              ترجمة بالذكاء الاصطناعي
            </button>
          )}
        </div>
      )}
    </div>
  );
}
