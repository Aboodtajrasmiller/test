import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Landmark, Plus, ArrowUpRight, ArrowDownLeft, History, Gift, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, writeBatch, doc, serverTimestamp, increment, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  method: string;
  status: string;
  description?: string;
  createdAt: any;
}

export default function Wallet() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'qi' | 'paypal' | 'mastercard' | 'googleplay' | 'zaincash' | 'asia' | null>(null);
  const [activeTab, setActiveTab] = useState<'recharge' | 'withdraw' | 'transfer'>('recharge');

  const amounts = [10, 25, 50, 100, 250, 500];

  const finalAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRecharge = async () => {
    if (!user || finalAmount <= 0 || !paymentMethod) return;

    setRecharging(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const batch = writeBatch(db);
      
    const getMethodName = (method: string) => {
        switch(method) {
          case 'qi': return 'كي كارد (Qi Card)';
          case 'paypal': return 'PayPal';
          case 'mastercard': return 'ماستر كارد (MasterCard)';
          case 'googleplay': return 'جوجل بلاي (Google Play Store)';
          case 'zaincash': return 'زين كاش (Zain Cash)';
          case 'asia': return 'آسيا حوالة (AsiaHawala)';
          default: return method;
        }
      };

      const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
      const txData = {
        amount: finalAmount,
        type: 'credit',
        method: paymentMethod,
        status: 'completed',
        description: `${t('wallet.recharge')} - ${getMethodName(paymentMethod)}`,
        createdAt: serverTimestamp()
      };

      const userRef = doc(db, 'users', user.uid);

      batch.set(txRef, txData);
      batch.update(userRef, {
        balance: increment(finalAmount)
      });

      await batch.commit();

      toast.success(t('wallet.success', { amount: finalAmount }), {
        icon: '💰',
        style: {
          borderRadius: '1.5rem',
          background: '#0f172a',
          color: '#fff',
          padding: '1rem 1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      });
      
      setSelectedAmount(null);
      setCustomAmount("");
      setPaymentMethod(null);
    } catch (error) {
      console.error(error);
      toast.error(t('wallet.failure'));
    } finally {
      setRecharging(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cards & Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Virtual Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-[1.6/1] w-full bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl group hover:shadow-blue-500/20 transition-all cursor-pointer"
          >
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Professional Barter Card</span>
                  <span className="text-xl font-bold tracking-tight">BarterPay</span>
                </div>
                <Zap size={24} className={profile?.subscriptionPlan === 'pro' ? "text-amber-400 fill-amber-400" : "opacity-20"} />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('wallet.balance')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">{profile?.balance || 0}</span>
                  <span className="text-sm font-bold opacity-80">PT</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase opacity-40">{t('wallet.card_holder')}</p>
                  <p className="text-xs font-bold tracking-wide">{user?.displayName?.toUpperCase()}</p>
                </div>
                <CreditCard size={32} className="opacity-40" />
              </div>
            </div>

            {/* Glossy Overlay */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/0 via-white/5 to-white/10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => setActiveTab('recharge')}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                activeTab === 'recharge' ? "bg-white border-blue-600 shadow-lg shadow-blue-500/5" : "bg-white border-slate-100 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  activeTab === 'recharge' ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                )}>
                  <Plus size={20} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{t('wallet.recharge')}</p>
                  <p className="text-[10px] text-slate-400 font-bold">بوابات دفع متنوعة</p>
                </div>
              </div>
              <ArrowUpRight size={18} className={activeTab === 'recharge' ? "text-blue-600" : "text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"} />
            </button>

            <button 
              onClick={() => setActiveTab('transfer')}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                activeTab === 'transfer' ? "bg-white border-blue-600 shadow-lg shadow-blue-500/5" : "bg-white border-slate-100 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  activeTab === 'transfer' ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                )}>
                  <Zap size={20} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{t('wallet.transfer')}</p>
                  <p className="text-[10px] text-slate-400 font-bold">إلى مستخدم آخر</p>
                </div>
              </div>
              <ArrowUpRight size={18} className={activeTab === 'transfer' ? "text-blue-600" : "text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"} />
            </button>

            <button 
              onClick={() => setActiveTab('withdraw')}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                activeTab === 'withdraw' ? "bg-white border-blue-600 shadow-lg shadow-blue-500/5" : "bg-white border-slate-100 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  activeTab === 'withdraw' ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                )}>
                  <ArrowDownLeft size={20} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{t('wallet.withdraw')}</p>
                  <p className="text-[10px] text-slate-400 font-bold">تحويل النقاط لنقد</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Soon</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interaction Form & History */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Workspace */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 pb-0">
               <h3 className="text-xl font-black text-slate-900 mb-2">
                 {t(`wallet.${activeTab}`)}
               </h3>
               <p className="text-xs text-slate-400 font-bold max-w-md">
                 {t(`wallet.${activeTab}_desc`)}
               </p>
            </div>

            <div className="p-8">
              {activeTab === 'recharge' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('wallet.select_amount')}</span>
                      {finalAmount > 0 && <span className="text-xs font-black text-blue-600">المبلغ الإجمالي: {finalAmount} PT</span>}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {amounts.map(amt => (
                        <button
                          key={amt}
                          onClick={() => {
                            setSelectedAmount(amt);
                            setCustomAmount("");
                          }}
                          className={cn(
                            "py-4 rounded-2xl border-2 transition-all font-black text-center text-sm",
                            selectedAmount === amt 
                              ? "border-blue-600 bg-blue-50 text-blue-600 shadow-inner" 
                              : "border-slate-50 bg-slate-50 text-slate-600 hover:border-slate-200"
                          )}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>

                    <div className="relative mt-4">
                      <input 
                        type="number"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        placeholder={t('wallet.custom_amount')}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all font-bold text-sm outline-none"
                      />
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('wallet.payment_method')}</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <PaymentMethodButton 
                        active={paymentMethod === 'qi'} 
                        onClick={() => setPaymentMethod('qi')}
                        icon={<CreditCard size={18} />}
                        label="Qi Card (كي كارد)"
                      />
                      <PaymentMethodButton 
                        active={paymentMethod === 'zaincash'} 
                        onClick={() => setPaymentMethod('zaincash')}
                        icon={<Zap size={18} />}
                        label="Zain Cash (زين كاش)"
                      />
                      <PaymentMethodButton 
                        active={paymentMethod === 'asia'} 
                        onClick={() => setPaymentMethod('asia')}
                        icon={<Landmark size={18} />}
                        label="AsiaHawala (آسيا حوالة)"
                      />
                      <PaymentMethodButton 
                        active={paymentMethod === 'paypal'} 
                        onClick={() => setPaymentMethod('paypal')}
                        icon={<Landmark size={18} />}
                        label="PayPal (بايبال)"
                      />
                      <PaymentMethodButton 
                        active={paymentMethod === 'mastercard'} 
                        onClick={() => setPaymentMethod('mastercard')}
                        icon={<CreditCard size={18} />}
                        label="MasterCard (ماستر كارد)"
                      />
                      <PaymentMethodButton 
                        active={paymentMethod === 'googleplay'} 
                        onClick={() => setPaymentMethod('googleplay')}
                        icon={<Gift size={18} />}
                        label="Google Play Store"
                      />
                    </div>
                  </div>

                  <button
                    disabled={finalAmount <= 0 || !paymentMethod || recharging}
                    onClick={handleRecharge}
                    className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl shadow-slate-900/10 hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {recharging ? (
                      <Zap size={20} className="animate-pulse text-blue-400" />
                    ) : (
                      <>{t('wallet.complete')} <ArrowUpRight size={20} /></>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'transfer' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">اسم المستخدم المستلم</label>
                    <div className="relative">
                       <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input 
                        type="text" 
                        placeholder="أدخل المعرف @username" 
                        className="w-full pr-12 pl-4 py-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">قيمة التحويل (PT)</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all text-left"
                    />
                  </div>
                  <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black transition-all flex items-center justify-center gap-2">
                    <Zap size={18} />
                    سيتم تفعيل التحويل قريباً
                  </button>
                </div>
              )}

              {activeTab === 'withdraw' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border-2 border-amber-100 border-dashed">
                    <Gift size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">نظام الربح قادم!</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">ستتمكن قريباً من تحويل مهاراتك التي بعتها إلى عملات حقيقية وسحبها مباشرة إلى حسابك.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* History List */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <History size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900">{t('wallet.history')}</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">آخر 50 عملية</span>
            </div>

            <div className="min-h-[300px]">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
                   <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center">
                     <History size={24} />
                   </div>
                   <p className="font-bold text-sm">{t('wallet.no_history')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {transactions.map((tx, idx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                          tx.type === 'credit' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {tx.type === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 mb-0.5">{tx.description}</h4>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{tx.id.slice(0, 8)}</span>
                             <span className="w-1 h-1 bg-slate-200 rounded-full" />
                             <span className="text-[9px] text-slate-400 font-bold">
                               {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : ""}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className={cn(
                          "text-xl font-black tracking-tight",
                          tx.type === 'credit' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                        </div>
                        <div className="flex items-center justify-end gap-1">
                           <span className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             tx.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"
                           )} />
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{tx.status}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-sm",
        active 
          ? "border-blue-600 bg-blue-50/50 shadow-sm" 
          : "border-slate-100 hover:border-slate-200"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
        )}>
          {icon}
        </div>
        <span className={cn("font-bold", active ? "text-slate-900" : "text-slate-600")}>{label}</span>
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
        active ? "border-blue-600 bg-blue-600" : "border-slate-200"
      )}>
        {active && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </button>
  );
}
