import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, Globe, Zap, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const BARTER_INDICES = [
  { name: 'Tech Barter Index (TBI)', value: 4230.15, change: 2.4, status: 'bullish' },
  { name: 'Creative Services (CSX)', value: 1850.40, change: -0.8, status: 'stable' },
  { name: 'Marketing Yield (MY)', value: 3120.90, change: 1.5, status: 'rising' },
  { name: 'Global Skill Liquidity', value: 92.4, change: 0.5, isPercent: true, status: 'bullish' },
];

export function LiveMarketDashboard() {
  const { i18n } = useTranslation();
  const [indices, setIndices] = useState(BARTER_INDICES);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setIndices(current => current.map(idx => {
        const move = (Math.random() - 0.45) * (idx.change > 0 ? 0.2 : 0.4);
        const newValue = idx.value * (1 + move / 100);
        return {
          ...idx,
          value: newValue,
          change: Number((idx.change + move).toFixed(2)),
          status: move > 0 ? 'bullish' : 'bearish'
        };
      }));
      setLastUpdate(new Date());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mt-8 mb-20 bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Globe size={24} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                {i18n.language === 'ar' ? 'بورصة المقايضة العالمية' : 'Global Barter Exchange'}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 animate-pulse">
                  <Activity size={10} />
                  LIVE
                </div>
              </h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                {i18n.language === 'ar' ? 'تحديث مباشر لقيمة المهارات في السوق' : 'Live Global Skill Value Index'}
              </p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mb-1">Last Update</div>
             <div className="font-mono text-sm text-blue-400">
               {lastUpdate.toLocaleTimeString()}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {indices.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                <div className={item.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {item.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black tabular-nums">
                  {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {item.isPercent ? '%' : ''}
                </span>
                <span className={item.change >= 0 ? "text-emerald-400 text-xs font-bold" : "text-rose-400 text-xs font-bold"}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: "30%" }}
                  animate={{ width: Math.abs(item.change * 10) + "%" }}
                  className={item.change >= 0 ? "h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-8 pt-8 border-t border-white/5">
          <MarketStat icon={<Users size={16} />} label={i18n.language === 'ar' ? "متداولون نشطون" : "Active Traders"} value="12,402" />
          <MarketStat icon={<Zap size={16} />} label={i18n.language === 'ar' ? "عمليات المقايضة" : "Barter Operations"} value="45.2k" />
          <MarketStat icon={<Activity size={16} />} label={i18n.language === 'ar' ? "حجم التداول اليومي" : "Daily Volume"} value="$1.2M Eq." />
        </div>
      </div>

      {/* Decorative background visual */}
      <div className="absolute top-0 right-0 w-[600px] h-full pointer-events-none opacity-20 overflow-hidden">
        <svg viewBox="0 0 1000 1000" className="w-full h-full text-blue-500">
           <path d="M0,500 Q250,400 500,500 T1000,500" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" className="animate-pulse" />
           <path d="M0,600 Q250,500 500,600 T1000,600" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
    </section>
  );
}

function MarketStat({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-blue-400">{icon}</div>
      <div>
        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-sm font-bold text-white tabular-nums">{value}</div>
      </div>
    </div>
  );
}
