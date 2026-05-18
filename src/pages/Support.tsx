import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, MessageSquare, HelpCircle, AlertTriangle, FileText, Search, Star, Mail, X, Send, Phone } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function Support() {
  const [search, setSearch] = useState("");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  const FAQs = [
    { q: "كيف تعمل عملية المقايضة؟", a: "تتم من خلال الاتفاق على تبادل مهارة مقابل مهارة أو مقابل نقاط (PT). يتم حجز النقاط وسحبها عند تأكيد استلام العمل." },
    { q: "هل المنصة مجانية؟", a: "نعم، المنصة توفر نموذجاً مجانياً للاستخدام الأساسي، مع خيارات عضوية ممتازة (Pro) للحصول على ميزات إضافية وعمولات مخفضة." },
    { q: "ماذا أفعل إذا لم يلتزم الطرف الآخر؟", a: "يمكنك رفع تذكرة نزاع فورية من صفحة المقايضة. فريق الدعم سيراجع تفاصيل العمل والتواصل لضمان حقك." },
    { q: "كيف أقوم بشحن رصيدي؟", a: "من خلال صفحة المحفظة، يمكنك الشحن عبر كي كارد، بايبال، أو بطاقات جوجل بلاي." }
  ];

  const filteredFAQs = FAQs.filter(faq => faq.q.includes(search) || faq.a.includes(search));

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-12 px-4">
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
        >
          <HelpCircle size={14} className="text-blue-400" />
          Help Center
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">كيف يمكننا مساعدتك اليوم؟</h1>
        <div className="relative max-w-xl mx-auto mt-8">
           <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
            type="text" 
            placeholder="ابحث عن حلول، إرشادات، أو معلومات..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-12 pl-6 py-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 focus:ring-2 focus:ring-blue-500 font-bold transition-all"
           />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SupportCard 
          icon={<ShieldCheck className="text-emerald-500" />}
          title="ميثاق الأمان"
          desc="قواعد تضمن حقوقك المهنية."
          variant="emerald"
        />
        <SupportCard 
          icon={<AlertTriangle className="text-rose-500" />}
          title="حل النزاعات"
          desc="نظام فني لفض الخلافات بعدالة."
          variant="rose"
        />
        <SupportCard 
          icon={<Star size={24} className="text-blue-500" />}
          title="دليل النجاح"
          desc="نصائح لتحقيق أفضل مقايضة."
          variant="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <section className="lg:col-span-12 space-y-8">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-900">الأسئلة الشائعة</h2>
              <span className="text-xs font-bold text-slate-400">إجابات فورية</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFAQs.map((faq, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="bg-white p-8 rounded-[2rem] border border-slate-50 hover:border-slate-200 transition-all shadow-sm group"
                >
                  <h3 className="font-black text-slate-900 mb-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
           </div>
        </section>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden text-center space-y-8 shadow-2xl">
         <div className="relative z-10 space-y-6">
            <div className="space-y-4">
               <h2 className="text-2xl font-black">ما زلت بحاجة للمساعدة؟</h2>
               <p className="opacity-70 text-sm max-w-md mx-auto font-medium">فريق الدعم الفني لدينا متاح لمساعدتك في أي استفسار تقني أو إداري يخص حسابك.</p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
               <div className="flex flex-wrap items-center justify-center gap-4">
                  <button className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-50 transition-all">
                     <MessageSquare size={18} />
                     تحدث معنا مباشرة
                  </button>
                  <button className="bg-white/10 backdrop-blur-md text-white border border-white/10 px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-white/20 transition-all">
                     <FileText size={18} />
                     فتح تذكرة دعم
                  </button>
               </div>
               
               <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsContactModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all w-full max-w-xs justify-center border border-blue-400/30"
               >
                  <Mail size={22} />
                  تواصل مع الدعم
               </motion.button>
            </div>
         </div>
         {/* Background Decor */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">تواصل معنا</h2>
                    <p className="text-xs text-slate-400 font-bold">سنرد عليك في أقرب وقت ممكن</p>
                  </div>
                  <button 
                    onClick={() => setIsContactModalOpen(false)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsContactModalOpen(false); }}>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2">الموضوع</label>
                    <input 
                      type="text" 
                      placeholder="كيف يمكننا مساعدتك؟"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2">الرسالة</label>
                    <textarea 
                      rows={4}
                      placeholder="اكتب تفاصيل طلبك هنا..."
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl text-blue-600">
                      <Mail size={18} />
                      <div className="text-[10px] font-black uppercase">Email US</div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                      <Phone size={18} />
                      <div className="text-[10px] font-black uppercase">Call US</div>
                    </div>
                  </div>

                  <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                    <Send size={18} />
                    إرسال الرسالة
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SupportCard({ icon, title, desc, variant }: { icon: any; title: string, desc: string, variant: string }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all cursor-pointer text-center group"
    >
      <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 transition-all group-hover:rotate-12", colors[variant as keyof typeof colors])}>
        {icon}
      </div>
      <h3 className="font-black text-slate-900 mb-2 truncate px-2">{title}</h3>
      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{desc}</p>
    </motion.div>
  );
}

