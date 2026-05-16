import { motion } from 'motion/react';
import { ShieldCheck, MessageSquare, HelpCircle, AlertTriangle, FileText } from 'lucide-react';

export function Support() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 text-slate-900">مركز الدعم والأمان</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          نحن هنا لمساعدتك في إدارة أصعب المواقف وضمان تجربة مقايضة عادلة وآمنة للجميع.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SupportCard 
          icon={<ShieldCheck className="text-emerald-500" />}
          title="ميثاق المقايضة الآمنة"
          desc="مجموعة من القواعد التي تضمن حقوقك عند تبادل المهارات."
        />
        <SupportCard 
          icon={<AlertTriangle className="text-amber-500" />}
          title="الإبلاغ عن نزاع"
          desc="واجهت مشكلة مع طرف آخر؟ افتح تذكرة نزاع وسيتدخل نظامنا لفضه."
        />
        <SupportCard 
          icon={<MessageSquare className="text-blue-500" />}
          title="استشارة الذكاء الاصطناعي"
          desc="دع الذكاء الاصطناعي يساعدك في صياغة اتفاقية مقايضة واضحة."
        />
        <SupportCard 
          icon={<HelpCircle className="text-purple-500" />}
          title="الأسئلة الشائعة"
          desc="إجابات سريعة على التساؤلات حول كيفية عمل النظام."
        />
      </div>

      <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <FileText className="text-slate-400" />
          كيفية التعامل مع المواقف الصعبة؟
        </h2>
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            1. <strong>تحديد النطاق بدقة:</strong> قبل البدء، اتفق مع الطرف الآخر على مخرجات العمل بالضبط (مثلاً: عدد صفحات الموقع أو عدد الساعات).
          </p>
          <p>
            2. <strong>التواصل عبر المنصة:</strong> احتفظ دائماً بسجل المحادثات هنا لضمان وجود مرجع عند حدوث خلاف.
          </p>
          <p>
            3. <strong>التقييم الصادق:</strong> بعد انتهاء المقايضة، اترك تقييماً يعكس الواقع لمساعدة المجتمع على تحديد الموثوقين.
          </p>
        </div>
      </section>
    </div>
  );
}

function SupportCard({ icon, title, desc }: { icon: any; title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer group transition-all"
    >
      <div className="p-3 bg-slate-50 rounded-xl w-fit mb-4 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
