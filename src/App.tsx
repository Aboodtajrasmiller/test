/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layout } from './components/Layout';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeftRight, TrendingUp, Users, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { findSkillMatches, MatchResult } from './services/geminiService';
import { Skill } from './constants';
import { MatchAnalysisModal } from './components/MatchAnalysisModal';
import { cn } from './lib/utils';
import { useAuth } from './context/AuthContext';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './lib/firebase';
import { createTradeRequest } from './services/tradeService';

export default function App() {
  const { profile, user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MatchResult | null>(null);
  const [targetName, setTargetName] = useState("");
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(3));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== user?.uid);
        setRecommendedUsers(fetched);
      } catch (error) {
        // Silent fail for home page
      }
    };
    fetchRecommendations();
  }, [user]);

  const handleAnalyze = async (targetUser: any) => {
    if (!profile) {
      toast.error("يرجى تسجيل الدخول وإكمال ملفك الشخصي");
      return;
    }

    setTargetName(targetUser.displayName);
    setModalOpen(true);
    setLoading(true);
    
    const result = await findSkillMatches(
      { skillsOffered: profile.skillsOffered || [], skillsWanted: profile.skillsWanted || [] },
      { skillsOffered: targetUser.skillsOffered || [], skillsWanted: targetUser.skillsWanted || [] }
    );

    setAnalysisResult(result);
    setLoading(false);
    
    if (!result) {
      toast.error("فشل التحليل الذكي");
      setModalOpen(false);
    }
  };

  const handleTradeRequest = async (targetUser: any) => {
    if (!user || !profile) {
      toast.error("يرجى تسجيل الدخول وإكمال ملفك الشخصي أولاً");
      return;
    }

    try {
      await createTradeRequest(
        user.uid,
        targetUser.id,
        user.displayName || "مستخدم",
        profile.skillsOffered?.[0]?.name || "خدمات مهنية",
        targetUser.skillsOffered?.[0]?.name || "خدمات مهنية",
        profile.subscriptionPlan || 'free'
      );
      toast.success(`تم إرسال طلب المقايضة إلى ${targetUser.displayName}`);
    } catch (error: any) {
      if (error.message === "LIMIT_REACHED") {
        toast.error("لقد وصلت للحد الأقصى للمقايضات (3) في الخطة المجانية. يرجى الترقية!");
      } else {
        toast.error("فشل إرسال الطلب");
      }
    }
  };

  return (
    <Layout>
      <Toaster position="top-center" />
      
      <MatchAnalysisModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        loading={loading}
        result={analysisResult}
        targetName={targetName}
      />
      
      {/* Hero Section */}
      <section className="mb-12">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
          <div className="relative z-10 max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
            >
              اقتصاد المقايضة الذكي للمحترفين
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-blue-100 text-lg mb-8 leading-relaxed"
            >
              تبادل خبراتك ومهاراتك مباشرة مع المحترفين من جميع أنحاء العالم. بدون نقود، فقط القيمة مقابل القيمة، مدعوماً بذكاء اصطناعي يجد لك الشريك المثالي.
            </motion.p>
            <div className="flex flex-wrap gap-4">
              <Link to="/explore" className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all transform hover:scale-105 inline-block text-center">
                تصفح المقايضات
              </Link>
              <Link to="/profile" className="bg-blue-500/30 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500/40 transition-all inline-block text-center">
                أضف مهاراتك
              </Link>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl -ml-20 -mb-20"></div>
        </div>
      </section>

      {/* Welcome & System Section */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest">
              أهلاً بك في المجتمع العالمي
            </div>
            <h2 className="text-4xl font-bold leading-tight">مرحباً بك في مجتمع المقايضة العكسية</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              نحن لا نؤمن بالمال كعائق أمام الإبداع. نظامنا يكسر القواعد التقليدية للعمل الحر، حيث يمكنك الحصول على أفضل الخدمات المهنية من خلال تقديم مهاراتك الخاصة في المقابل.
            </p>
            <div className="flex gap-4">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    U{i}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                انضم إلى <span className="font-bold text-slate-900">+1,200</span> محترف يتبادلون الخبرات يومياً.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="text-amber-500" />
              نظامنا: كيف تعمل المقايضة؟
            </h3>
            <div className="space-y-6">
              <SystemStep 
                number="01" 
                title="أضف مهاراتك واحتياجاتك" 
                desc="حدد ما تتقنه وما تبحث عنه في ملفك الشخصي." 
              />
              <SystemStep 
                number="02" 
                title="الذكاء الاصطناعي يحلل" 
                desc="يقوم محركنا بربطك بأشخاص لديهم بالضبط ما تحتاجه ويريدون ما تقدمه." 
              />
              <SystemStep 
                number="03" 
                title="ابدأ المقايضة" 
                desc="اتفق على نطاق العمل وقم بتبادل القيمة مباشرة وبدون وسطاء ماليين." 
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="mb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">خدماتنا المهنية</h2>
          <p className="text-slate-500">نغطي كافة المجالات التي يحتاجها رواد الأعمال والمستقلون لبناء مشاريعهم.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ServiceBox icon="💻" title="تطوير البرمجيات" count="450+ مقايض" />
          <ServiceBox icon="🎨" title="التصميم الإبداعي" count="320+ مقايض" />
          <ServiceBox icon="✍️" title="كتابة المحتوى" count="280+ مقايض" />
          <ServiceBox icon="📢" title="التسويق الرقمي" count="190+ مقايض" />
          <ServiceBox icon="⚖️" title="استشارات قانونية" count="85+ مقايض" />
          <ServiceBox icon="📊" title="تحليل البيانات" count="120+ مقايض" />
          <ServiceBox icon="🎥" title="مونتاج وفيديو" count="210+ مقايض" />
          <ServiceBox icon="🌐" title="الترجمة واللغات" count="150+ مقايض" />
        </div>
      </section>

      {/* Subscription Section */}
      <section className="mb-20">
        <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">اشتراكك في المنصة</h2>
              <p className="text-slate-400 text-lg mb-8">
                نحن نؤمن بالوصول العادل للمهارات. اختر الخطة التي تناسب حجم نشاطك وتوسع في تبادل خبراتك.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                  <span>وصول غير محدود لترشيحات الذكاء الاصطناعي</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                  <span>نظام تقييم وموثوقية متقدم</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">✓</div>
                  <span>دعم فني متخصص للمقايضات الكبرى</span>
                </li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PriceCard 
                title="الأساسية" 
                price="مجاناً" 
                desc="للمبتدئين في عالم المقايضة" 
                features={["3 مقايضات شهرياً", "تحليل ذكي أساسي"]} 
              />
              <PriceCard 
                title="المحترفة" 
                price="$19" 
                desc="للنشطين ورواد الأعمال" 
                active 
                features={["مقايضات بلا حدود", "أولوية الظهور", "تحليل ذكي عميق"]} 
              />
            </div>
          </div>
          
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <TrendingUp size={400} className="scale-150 -rotate-12 translate-x-20" />
          </div>
        </div>
      </section>

      {/* Inspiration & Values Section */}
      <section className="mb-20">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-[3rem] p-12 text-center border border-slate-100 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-2xl mx-auto"
          >
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-8 text-blue-300">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-medium text-slate-400 mb-8 tracking-widest uppercase">صدق التعامل وإخلاص النية</h2>
            
            <div className="space-y-6">
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-slate-800 italic"
              >
                أستغفر الله
              </motion.p>
              <div className="w-px h-8 bg-slate-200 mx-auto"></div>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-serif text-slate-700 italic"
              >
                أستغفر الله رب البرايا
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-serif text-slate-700 italic"
              >
                أستغفر الله من الخطايا
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-lg text-slate-500 font-medium"
              >
                من ذنوب بها...
              </motion.p>
            </div>

            <p className="mt-12 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              نحن نؤمن أن البركة في الرزق تبدأ بصدق النية وصفاء القلب. المقايضة عندنا ليست مجرد تبادل مهارات، بل هي بناء لمجتمع يقوم على الثقة والمحبة.
            </p>
          </motion.div>

          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
      </section>

      {/* Recommended Matches Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Sparkles size={20} />
            </div>
            <h2 className="text-2xl font-bold">ترشيحات الذكاء الاصطناعي لك</h2>
          </div>
          <Link to="/explore" className="text-blue-600 font-medium text-sm hover:underline">عرض الكل</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedUsers.length > 0 ? (
            recommendedUsers.map(u => (
              <MatchCard 
                key={u.id}
                name={u.displayName} 
                isPro={u.subscriptionPlan === 'pro'}
                title={`${u.skillsOffered?.[0]?.name || 'محترف'} متخصص`} 
                offering={u.skillsOffered?.map((s: Skill) => s.name).join("، ") || "مهارات متنوعة"} 
                needs={u.skillsWanted?.map((s: Skill) => s.name).join("، ") || "مهارات محددة"} 
                matchScore={Math.floor(Math.random() * 30) + 70}
                onAnalyze={() => handleAnalyze(u)}
                onTrade={() => handleTradeRequest(u)}
              />
            ))
          ) : (
             <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-100">
               <p className="text-slate-400">انضم إلينا لتظهر هنا!</p>
             </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function StatCard({ icon, label, value, trend }: { icon: any; label: string; value: string; trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
        <span className="text-slate-500 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-slate-400">{trend}</div>
    </div>
  );
}

function MatchCard({ name, title, offering, needs, matchScore, onAnalyze, onTrade, isPro }: { name: string; title: string; offering: string; needs: string; matchScore: number; onAnalyze: () => any; onTrade: () => any; isPro?: boolean; key?: any }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-slate-800">{name}</h3>
              {isPro && (
                <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 rounded uppercase tracking-tighter">PRO</span>
              )}
            </div>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-emerald-100">
          تطابق {matchScore}%
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-3 bg-blue-50/50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-blue-500 block mb-1">تعرض:</span>
          <p className="text-sm text-slate-700 font-medium">{offering}</p>
        </div>
        <div className="p-3 bg-amber-50/50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">تبحث عن:</span>
          <p className="text-sm text-slate-700 font-medium">{needs}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onAnalyze}
          className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
        >
          تحليل بالذكاء
          <Wand2 size={14} />
        </button>
        <button 
          onClick={onTrade}
          className="flex-[2] py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-wide hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          طلب مقايضة
          <ArrowLeftRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function SystemStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl font-black text-blue-100">{number}</div>
      <div>
        <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function ServiceBox({ icon, title, count }: { icon: string; title: string; count: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center hover:border-blue-200 transition-colors group cursor-default">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-[10px] text-slate-400">{count}</p>
    </div>
  );
}

function PriceCard({ title, price, desc, features, active }: { title: string; price: string; desc: string; features: string[]; active?: boolean }) {
  return (
    <div className={cn(
      "p-8 rounded-3xl border transition-all",
      active ? "bg-white text-slate-900 border-white shadow-xl scale-105" : "bg-slate-800 text-white border-slate-700 hover:border-slate-600"
    )}>
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className={cn("text-sm mb-6", active ? "text-slate-500" : "text-slate-400")}>{desc}</p>
      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-4xl font-black">{price}</span>
        {price !== "مجاناً" && <span className="text-sm opacity-50">/شهرياً</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map(f => (
          <li key={f} className="text-xs flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px]", active ? "bg-blue-100 text-blue-600" : "bg-slate-700 text-slate-300")}>✓</div>
            {f}
          </li>
        ))}
      </ul>
      <Link 
        to="/subscription"
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm transition-all text-center block",
          active ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-slate-900 hover:bg-slate-100"
        )}
      >
        اختر هذه الخطة
      </Link>
    </div>
  );
}
