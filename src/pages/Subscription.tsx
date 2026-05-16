import { motion } from 'motion/react';
import { Check, Crown, Zap, Shield, Star, Diamond } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export function Subscription() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const upgradePlan = async (plan: 'free' | 'pro') => {
    if (!user) return;
    setLoading(plan);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        subscriptionPlan: plan
      });
      toast.success(plan === 'pro' ? "مبروك! أنت الآن مشترك في الخطة المحترفة" : "تم تحويل خطتك إلى المجانية");
      // Note: In a real app, the profile state will update via the onSnapshot/Auth listener if implemented, 
      // but here we might need to refresh or rely on the reload.
      window.location.reload(); 
    } catch (error) {
      toast.error("حدث خطأ أثناء ترقية الحساب");
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = profile?.subscriptionPlan || 'free';

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        >
          خطط الأسعار
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">اختر الخطة التي تناسب رحلتك</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          استفد من كامل إمكانيات منصة المقايضة مع ميزات حصرية مصممة للمحترفين ورواد الأعمال الصاعدين.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Free Plan */}
        <PlanCard
          title="الخطة الأساسية"
          price="مجاناً"
          description="مثالية للمبتدئين الذين يرغبون في تجربة عالم المقايضة العكسية."
          icon={<Zap size={24} className="text-slate-400" />}
          features={[
            "3 طلبات مقايضة شهرياً",
            "عرض 5 مهارات كحد أقصى",
            "تحليلات ذكاء اصطناعي أساسية",
            "دعم مجتمعي"
          ]}
          isCurrent={currentPlan === 'free'}
          isLoading={loading === 'free'}
          onSelect={() => upgradePlan('free')}
          buttonText="الخطة الحالية"
        />

        {/* Pro Plan */}
        <PlanCard
          title="الخطة المحترفة"
          price="$19"
          description="للمحترفين ورواد الأعمال الذين يريدون النمو السريع وبناء علاقات قوية."
          icon={<Crown size={24} className="text-amber-500" />}
          features={[
            "طلبات مقايضة غير محدودة",
            "عرض مهارات بلا حدود",
            "أولوية الظهور في نتائج البحث",
            "تحليلات ذكاء اصطناعي عميقة",
            "دعم فني متميز",
            "شارة 'محترف' موثقة"
          ]}
          highlighted
          isCurrent={currentPlan === 'pro'}
          isLoading={loading === 'pro'}
          onSelect={() => upgradePlan('pro')}
          buttonText={currentPlan === 'pro' ? "مشترك حالياً" : "ترقية الآن"}
        />
      </div>

      {/* Comparison Table Small Note */}
      <div className="mt-20 text-center">
        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
          <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
            <Shield className="text-emerald-500" />
            ضمان الجودة والأمان
          </h3>
          <p className="text-slate-500 text-sm max-w-3xl mx-auto">
            جميع الخطط تشمل الحماية ضد الاحتيال ونظام فض النزاعات المتكامل. نحن نضمن أن تكون كل عملية مقايضة عادلة ومثمرة للطرفين.
          </p>
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
  onSelect,
  buttonText
}: PlanCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={cn(
        "p-10 rounded-[3rem] border transition-all relative flex flex-col h-full",
        highlighted 
          ? "bg-slate-900 text-white border-slate-900 shadow-2xl scale-105 z-10" 
          : "bg-white text-slate-900 border-slate-100 shadow-sm"
      )}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-amber-500/20">
          الأكثر طلباً
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className={cn("p-3 rounded-2xl", highlighted ? "bg-slate-800" : "bg-slate-50")}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black">{price}</span>
          {price !== "مجاناً" && <span className={cn("text-sm", highlighted ? "text-slate-400" : "text-slate-500")}>/شهرياً</span>}
        </div>
      </div>

      <p className={cn("text-sm leading-relaxed mb-10", highlighted ? "text-slate-400" : "text-slate-500")}>
        {description}
      </p>

      <ul className="space-y-4 mb-10 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-sm">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
              highlighted ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
            )}>
              <Check size={12} strokeWidth={3} />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        disabled={isCurrent || isLoading}
        onClick={onSelect}
        className={cn(
          "w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          highlighted 
            ? "bg-white text-slate-900 hover:bg-slate-100" 
            : "bg-slate-900 text-white hover:bg-black"
        )}
      >
        {isLoading ? "جاري المعالجة..." : buttonText}
      </button>

      {isCurrent && (
        <div className="mt-4 text-center">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", highlighted ? "text-emerald-400" : "text-blue-500")}>
            أنت تستخدم هذه الخطة حالياً
          </span>
        </div>
      )}
    </motion.div>
  );
}
