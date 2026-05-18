import { motion } from 'motion/react';
import { Check, Crown, Zap, Shield, ArrowUpRight } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, collection, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function Subscription() {
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const upgradePlan = async (plan: 'free' | 'pro') => {
    if (!user) {
      toast.error(i18n.language === 'ar' ? "يرجى تسجيل الدخول أولاً" : "Please login first");
      return;
    }

    if (plan === 'free') {
       // Just downgrade for free (demo purposes)
       setLoading(plan);
       try {
         await writeBatch(db).update(doc(db, 'users', user.uid), { subscriptionPlan: 'free' }).commit();
         toast.success(i18n.language === 'ar' ? "تم العودة للخطة الأساسية" : "Downgraded to Free plan");
         setTimeout(() => window.location.reload(), 1500);
       } catch (e) {
         console.error(e);
       } finally {
         setLoading(null);
       }
       return;
    }

    const price = billingCycle === 'monthly' ? 19 : 154;
    const currentBalance = profile?.balance || 0;

    if (currentBalance < price) {
      toast.error(t('wallet.insufficient_balance'), {
        duration: 4000,
        icon: '⚠️'
      });
      navigate('/wallet'); // Redirect to recharge
      return;
    }

    setLoading(plan);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);
      const txRef = doc(collection(db, 'users', user.uid, 'transactions'));

      batch.update(userRef, {
        subscriptionPlan: 'pro',
        balance: increment(-price)
      });

      batch.set(txRef, {
        amount: price,
        type: 'debit',
        method: 'balance',
        status: 'completed',
        description: t('wallet.subscription_payment'),
        createdAt: serverTimestamp()
      });

      await batch.commit();

      toast.success(t('wallet.upgrade_success'), {
        icon: '👑',
        style: {
          borderRadius: '1.5rem',
          background: '#0f172a',
          color: '#fff',
        }
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      toast.error(i18n.language === 'ar' ? "فشل في تحديث خطة العضوية" : "Failed to upgrade subscription");
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = profile?.subscriptionPlan || 'free';

  return (
    <div className="max-w-6xl mx-auto py-20 px-4 space-y-20">
      <header className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-amber-100"
        >
          <Crown size={14} />
          Membership Plans
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-none">{t('subscription.title')}</h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm font-medium leading-relaxed">
          {t('subscription.subtitle')}
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center pt-8">
           <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={cn("px-6 py-2 rounded-xl text-xs font-black transition-all", billingCycle === 'monthly' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600")}
              >
                {t('subscription.monthly')}
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={cn("px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2", billingCycle === 'yearly' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600")}
              >
                {t('subscription.yearly')}
                <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase">{t('subscription.save')}</span>
              </button>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* Free Plan */}
        <PlanCard
          title={t('subscription.freePlan')}
          price="0"
          isYearly={billingCycle === 'yearly'}
          description={t('subscription.freeDesc')}
          icon={<Zap size={24} />}
          features={[
            i18n.language === 'ar' ? "3 طلبات مقايضة شهرياً" : "3 trade requests per month",
            i18n.language === 'ar' ? "عرض 5 مهارات كحد أقصى" : "List up to 5 skills",
            i18n.language === 'ar' ? "مطابقة مهارات أساسية" : "Basic skill matching",
            i18n.language === 'ar' ? "سجل معاملات بسيط" : "Basic transaction history"
          ]}
          isCurrent={currentPlan === 'free'}
          isLoading={loading === 'free'}
          onSelect={() => upgradePlan('free')}
          buttonText={t('subscription.currentPlan')}
        />

        {/* Pro Plan */}
        <PlanCard
          title={t('subscription.proPlan')}
          price={billingCycle === 'monthly' ? "19" : "154"}
          isYearly={billingCycle === 'yearly'}
          description={t('subscription.proDesc')}
          icon={<Crown size={24} />}
          features={[
            i18n.language === 'ar' ? "طلبات مقايضة غير محدودة" : "Unlimited trade requests",
            i18n.language === 'ar' ? "عرض مهارات بلا حدود" : "Unlimited skills listing",
            i18n.language === 'ar' ? "أولوية الظهور في نتائج البحث" : "Search priority",
            i18n.language === 'ar' ? "ميزات احترافية متقدمة" : "Advanced professional features",
            i18n.language === 'ar' ? 'شارة "Professional" موثقة' : '"Professional" badge',
            i18n.language === 'ar' ? "دعم فني فوري (VIP)" : "Express VIP support",
            i18n.language === 'ar' ? "عمولة صفرية على النقاط" : "Zero transaction fees"
          ]}
          highlighted
          isCurrent={currentPlan === 'pro'}
          isLoading={loading === 'pro'}
          onSelect={() => upgradePlan('pro')}
          buttonText={currentPlan === 'pro' ? t('subscription.activeNow') : t('subscription.startPro')}
        />
      </div>

      <div className="pt-20 text-center">
        <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 max-w-4xl mx-auto relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-3">
              <Shield className="text-blue-500" />
              أمانك وتجربة استخدامك هي أولويتنا
            </h3>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium leading-relaxed">
              جميع الخطط مدعومة بنظام حماية المعاملات الرقمية وشبكة الأمان المهنية. نحن هنا لنضمن أن كل ساعة عمل تبذلها تقابلها قيمة حقيقية تناسب طموحاتك.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  highlighted?: boolean;
  isCurrent?: boolean;
  isLoading?: boolean;
  isYearly?: boolean;
  onSelect: () => void;
  buttonText: string;
}

function PlanCard({ 
  title, 
  price, 
  description, 
  features, 
  icon, 
  highlighted, 
  isCurrent,
  isLoading,
  isYearly,
  onSelect,
  buttonText
}: PlanCardProps) {
  return (
    <motion.div
      whileHover={{ y: -12 }}
      className={cn(
        "p-10 rounded-[3rem] border transition-all relative flex flex-col h-full overflow-hidden group",
        highlighted 
          ? "bg-slate-900 text-white border-slate-900 shadow-2xl scale-105 z-10" 
          : "bg-white text-slate-900 border-slate-100 shadow-sm"
      )}
    >
      {highlighted && (
        <>
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-indigo-600/10" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-8 right-8">
             <div className="bg-amber-500 text-slate-900 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl shadow-amber-500/20">
               Best Choice
             </div>
          </div>
        </>
      )}

      <div className="relative z-10 space-y-10 flex-1 flex flex-col">
        <div className="space-y-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", highlighted ? "bg-white/10 text-blue-400" : "bg-slate-50 text-blue-600")}>
            {icon}
          </div>
          <h2 className="text-3xl font-black">{title}</h2>
          <p className={cn("text-xs font-bold leading-relaxed", highlighted ? "text-slate-400" : "text-slate-500")}>
            {description}
          </p>
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black">{price}$</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", highlighted ? "text-slate-500" : "text-slate-400")}>
              {price === "0" ? "" : isYearly ? "/ Yearly" : "/ Monthly"}
            </span>
          </div>
          {price === "0" && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Free Forever</p>}
        </div>

        <ul className="space-y-4 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-xs font-black">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                highlighted ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"
              )}>
                <Check size={12} strokeWidth={4} />
              </div>
              <span className={highlighted ? "text-slate-300" : "text-slate-700"}>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4">
          <button
            disabled={isCurrent || isLoading}
            onClick={onSelect}
            className={cn(
              "w-full h-16 rounded-[1.5rem] font-black text-sm tracking-wide transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-95 shadow-xl",
              highlighted 
                ? "bg-white text-slate-900 hover:bg-white/90 shadow-white/5" 
                : "bg-slate-900 text-white hover:bg-black shadow-slate-900/10"
            )}
          >
            {isLoading ? <Zap className="animate-spin" size={18} /> : buttonText}
            {!isCurrent && <ArrowUpRight size={18} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

