/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layout } from './components/Layout';
import { motion } from 'motion/react';
import { ArrowLeftRight, TrendingUp, Users, ShieldAlert, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Skill } from './constants';
import { cn } from './lib/utils';
import { useAuth } from './context/AuthContext';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db, signInWithGoogle } from './lib/firebase';
import { createTradeRequest } from './services/tradeService';
import { useTranslation } from 'react-i18next';
import { TranslatableContent } from './components/TranslatableContent';
import { LiveMarketDashboard } from './components/LiveMarketDashboard';

export default function App() {
  const { profile, user } = useAuth();
  const { t, i18n } = useTranslation();
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
      } catch {
        // Silent fail for home page
      }
    };
    fetchRecommendations();
  }, [user]);

  const handleTradeRequest = async (targetUser: any) => {
    if (!user || !profile) {
      toast.error("يرجى تسجيل الدخول وإكمال ملفك الشخصي أولاً");
      return;
    }

    const confirmed = window.confirm(`هل أنت متأكد من رغبتك في إرسال طلب مقايضة إلى ${targetUser.displayName}؟`);
    if (!confirmed) return;

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
      
      {user && !user.emailVerified && (
        <div className="bg-amber-50 border-b border-amber-100 p-2 text-center flex items-center justify-center gap-2 sticky top-0 z-50">
          <ShieldAlert size={16} className="text-amber-600" />
          <p className="text-[10px] md:text-xs font-bold text-amber-900">
            يرجى تفعيل بريدك الإلكتروني لتتمكن من إجراء المقايضات. تفقد صندوق الوارد!
          </p>
          <button 
            onClick={async () => {
              try {
                await user.sendEmailVerification();
                toast.success("تم إرسال رابط التفعيل");
              } catch {
                toast.error("فشل إرسال الرابط. حاول لاحقاً.");
              }
            }}
            className="text-[10px] md:text-xs font-black text-amber-600 underline hover:text-amber-700"
          >
            إعادة إرسال الرابط
          </button>
        </div>
      )}
      {/* Hero Section */}
      <section className="mb-20 relative px-4">
        <div className="bg-slate-950 rounded-[2.5rem] p-8 md:p-16 lg:p-24 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10 max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight"
            >
              {t('home.heroTitle')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl mb-12 leading-relaxed max-w-xl font-medium"
            >
              {t('home.heroSubtitle')}
            </motion.p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <>
                  <Link to="/explore" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-700 transition-all transform hover:scale-105 inline-flex items-center gap-3 text-lg shadow-xl shadow-blue-600/20">
                    {t('home.startExploring')}
                    <ArrowLeftRight size={20} />
                  </Link>
                  <Link to="/wallet" className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-emerald-700 transition-all transform hover:scale-105 inline-flex items-center gap-3 text-lg shadow-xl shadow-emerald-600/20">
                    {t('nav.wallet')}
                    <TrendingUp size={20} />
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    onClick={async () => {
                      const toastId = toast.loading("جاري فتح نافذة تسجيل الدخول...");
                      try {
                        await signInWithGoogle();
                        toast.success("تم تسجيل الدخول بنجاح", { id: toastId });
                      } catch (error: any) {
                        console.error("Login component error:", error);
                        if (error.code === 'auth/popup-blocked') {
                          toast.error("تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات في متصفحك.", { id: toastId });
                        } else {
                          toast.error(`فشل تسجيل الدخول: ${error.message || 'خطأ غير معروف'}`, { id: toastId });
                        }
                      }
                    }}
                    className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-700 transition-all transform hover:scale-105 inline-flex items-center gap-3 text-lg shadow-xl shadow-blue-600/20"
                  >
                    {t('nav.login')}
                    <ArrowLeftRight size={20} />
                  </button>
                  <Link to="/explore" className="bg-slate-800 text-white px-10 py-5 rounded-2xl font-black hover:bg-slate-700 transition-all inline-flex items-center gap-3 text-lg border border-slate-700">
                    {t('home.startExploring')}
                    <Users size={20} />
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Abstract geometric elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -ml-24 -mb-24"></div>
          
          <div className="absolute top-1/2 right-12 -translate-y-1/2 hidden lg:block opacity-20 rotate-12">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Global Barter Stock Market Section */}
      <section className="px-4 mb-24">
         <LiveMarketDashboard />
      </section>

      {/* Stats Bar */}
      <section className="mb-24 px-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-12 py-12 border-y border-slate-100">
          <StatItem label={t('home.stats.active')} value="+2.5k" sub={i18n.language === 'ar' ? "نمو شهري 15%" : "15% Monthly Growth"} />
          <StatItem label={t('home.stats.success')} value="12.4k" sub={i18n.language === 'ar' ? "بلا وسيط مالي" : "No Financial Middleman"} />
          <StatItem label={t('home.stats.saving')} value="$450k" sub={i18n.language === 'ar' ? "قيمة المهارات المتبادلة" : "Value of Exchanged Skills"} />
          <StatItem label={t('home.stats.accuracy')} value="98%" sub={i18n.language === 'ar' ? "بفضل المجتمع الموثوق" : "Thanks to Trusted Community"} />
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="mb-32 px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">لماذا منصة المقايضة؟</h2>
          <p className="text-slate-500 text-lg">صممنا بيئة احترافية تضمن لك الحصول على أفضل النتائج بأقل التكاليف المالية.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<ArrowLeftRight className="text-blue-500" />}
            title="تطابق المهارات"
            desc="نظام مطابقة مهاراتك المعروضة مع احتياجات الآخرين لضمان نجاح المقايضة."
          />
          <FeatureCard 
            icon={<ArrowLeftRight className="text-emerald-500" />}
            title="نظام مقايضة متكامل"
            desc="إدارة كاملة لطلبات المقايضة من التواصل الأول وحتى تسليم العمل بنظام تقييم موثوق."
          />
          <FeatureCard 
            icon={<TrendingUp className="text-purple-500" />}
            title="تطوير مهني مستمر"
            desc="بناء معرض أعمالك وحصد تقييمات إيجابية يرفع من قيمتك في المجتمع الرقمي."
          />
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
                title="التواصل المباشر" 
                desc="نظامنا يقوم بربطك بأشخاص لديهم بالضبط ما تحتاجه ويريدون ما تقدمه." 
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
              <div className="inline-block px-4 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                خصومات باقة المحترفين
              </div>
              <h2 className="text-4xl font-bold mb-6">اشتراكك في المنصة</h2>
              <p className="text-slate-400 text-lg mb-8">
                نحن نؤمن بالوصول العادل للمهارات. اختر الخطة التي تناسب حجم نشاطك وتوسع في تبادل خبراتك.
              </p>
              <div className="flex flex-wrap gap-4">
                 <Link to="/subscription" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all">
                    عرض الخطط والأسعار
                 </Link>
                 <Link to="/wallet" className="bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-black hover:bg-white/20 transition-all">
                    شحن رصيد المحفظة
                 </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PriceCard 
                title="الأساسية" 
                price="مجاناً" 
                desc="للمبتدئين في عالم المقايضة" 
                features={["3 مقايضات شهرياً", "مطابقة أساسية"]} 
              />
              <PriceCard 
                title="المحترفة" 
                price="$19" 
                desc="للنشطين ورواد الأعمال" 
                active 
                features={["مقايضات بلا حدود", "أولوية الظهور", "ميزات احترافية"]} 
              />
            </div>
          </div>
          
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <TrendingUp size={400} className="scale-150 -rotate-12 translate-x-20" />
          </div>
        </div>
      </section>

      {/* Inspiration & Values Section */}
      <section className="mb-24 px-4">
        <div className="bg-slate-50 rounded-[3.5rem] p-12 md:p-20 text-center border border-slate-100 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm text-slate-400 text-xs font-bold mb-12 tracking-widest uppercase">
              <Star size={14} className="text-amber-400" />
              <span>فلسفتنا في العمل التجاري</span>
            </div>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter"
                >
                  أستغفر الله
                </motion.p>
                <div className="w-12 h-1 bg-blue-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[2rem] border border-white">
                  <p className="text-3xl font-serif text-slate-800 italic leading-tight mb-4 text-right">
                    أستغفر الله رب البرايا، أستغفر الله من الخطايا
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed text-right">
                    نحن نؤمن أن البركة في الرزق تبدأ بصدق النية وصفاء القلب. المقايضة عندنا ليست مجرد تبادل مهارات، بل هي بناء لمجتمع يقوم على الثقة والمحبة.
                  </p>
                </div>
                <div className="flex flex-col justify-center text-right space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">القيم فوق الأرقام</h3>
                  <p className="text-slate-500 leading-relaxed">
                    نسعى لبناء نظام عالمي بديل يعترف بالقيمة الفكرية والمهارية كعملة أساسية، بعيداً عن تقلبات السوق المالي.
                  </p>
                  <div className="flex gap-2 justify-end">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-1 bg-blue-100 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="gridLarge" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#gridLarge)" />
            </svg>
          </div>
        </div>
      </section>

      {/* Recommended Matches Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">ترشيحات المجتمع لك</h2>
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

function FeatureCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-inner">
        {icon}
      </div>
      <h4 className="text-xl font-bold mb-3">{title}</h4>
      <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function StatItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="text-center group cursor-default">
      <div className="text-4xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{value}</div>
      <div className="text-sm font-bold text-slate-500 mb-0.5">{label}</div>
      <div className="text-[10px] text-slate-400 font-medium">{sub}</div>
    </div>
  );
}

function MatchCard({ name, title, offering, needs, matchScore, onTrade, isPro }: { name: string; title: string; offering: string; needs: string; matchScore: number; onTrade: () => any; isPro?: boolean; key?: any }) {
  const { t, i18n } = useTranslation();
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
            <div className="text-xs text-slate-500">
               <TranslatableContent content={title} />
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-emerald-100">
          {i18n.language === 'ar' ? `تطابق ${matchScore}%` : `Match ${matchScore}%`}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-3 bg-blue-50/50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-blue-500 block mb-1">{t('marketplace.skillsOffered')}</span>
          <div className="text-sm text-slate-700 font-medium">
             <TranslatableContent content={offering} />
          </div>
        </div>
        <div className="p-3 bg-amber-50/50 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">{t('marketplace.skillsWanted')}</span>
          <div className="text-sm text-slate-700 font-medium">
             <TranslatableContent content={needs} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onTrade}
          className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-wide hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          {t('marketplace.requestTrade')}
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
    <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group cursor-default">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter opacity-60">{count}</p>
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
