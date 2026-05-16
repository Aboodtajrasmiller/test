import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Wand2 } from 'lucide-react';
import { MatchResult } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: MatchResult | null;
  loading: boolean;
  targetName: string;
}

export function MatchAnalysisModal({ isOpen, onClose, result, loading, targetName }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-bold">تحليل التوافق الذكي</h2>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="text-blue-600"
                  >
                    <Wand2 size={48} />
                  </motion.div>
                  <p className="text-slate-500 font-medium animate-pulse">جاري تحليل المهارات والاحتياجات...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="font-bold text-emerald-700 underline underline-offset-4 decoration-2">درجة التوافق بينك وبين {targetName}</span>
                    <span className="text-4xl font-black text-emerald-600">{result.compatibilityScore}%</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800">لماذا هذا التطابق مثالي؟</h3>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                      {result.reason}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800">مشروع مقترح للتعاون:</h3>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-blue-700 font-medium">{result.suggestedProject}</p>
                    </div>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    ابدأ المقايضة الآن
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-red-500">
                  فشل في الحصول على تحليل. حاول مرة أخرى لاحقاً.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
