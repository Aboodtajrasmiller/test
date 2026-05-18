import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Globe, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

const INITIAL_STOCK_DATA = [
  { symbol: 'S&P 500', value: 5222.19, change: 1.2, up: true },
  { symbol: 'NASDAQ', value: 16388.24, change: 0.8, up: true },
  { symbol: 'DOW J', value: 39512.84, change: -0.3, up: false },
  { symbol: 'FTSE 100', value: 8433.76, change: 0.5, up: true },
  { symbol: 'GOLD', value: 2360.20, change: 1.1, up: true, isCurrency: true },
  { symbol: 'BTC', value: 66240, change: 2.4, up: true, isCurrency: true },
  { symbol: 'USD/SAR', value: 3.75, change: 0.05, up: true },
  { symbol: 'OIL', value: 82.85, change: -0.4, up: false, isCurrency: true },
  { symbol: 'ETH', value: 3450.12, change: 1.8, up: true, isCurrency: true },
  { symbol: 'NIKKEI', value: 38780.50, change: -0.2, up: false },
];

export function StockTicker() {
  const [stocks, setStocks] = useState(INITIAL_STOCK_DATA);

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(currentStocks => 
        currentStocks.map(stock => {
          // Volatility based on stock type
          const volatility = stock.symbol === 'BTC' ? 0.002 : 0.0005;
          const movePercent = (Math.random() - 0.5) * volatility;
          const newValue = stock.value * (1 + movePercent);
          // Accumulate change
          const newChange = stock.change + (movePercent * 100);
          return {
            ...stock,
            value: newValue,
            change: Number(newChange.toFixed(2)),
            up: movePercent >= 0
          };
        })
      );
    }, 2000); // 2 second frequency for even more "real-time" feel

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/95 overflow-hidden py-3 border-b-2 border-blue-500/30 relative z-50 backdrop-blur-md">
      <div className="flex whitespace-nowrap items-center">
        {/* Dynamic Indicator - Enlarged */}
        <div className="flex-shrink-0 px-6 bg-black border-r border-white/20 flex items-center gap-3 text-blue-400 text-xs font-black uppercase tracking-widest z-10">
          <div className="relative">
            <Globe size={16} className="animate-spin-slow" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
          </div>
          <span className="hidden sm:inline">Global Professional Index</span>
          <span className="sm:hidden">LIVE</span>
          <Activity size={14} className="text-emerald-500 animate-pulse" />
        </div>

        <motion.div 
          animate={{ x: [0, -2000] }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex items-center gap-14 pr-14"
        >
          {/* Multiply three times for very smooth long scroll */}
          {[...stocks, ...stocks, ...stocks].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm font-black tracking-tight group transition-transform hover:scale-110">
              <span className="text-slate-500 font-bold">{item.symbol}</span>
              <span className="text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                {item.isCurrency ? '$' : ''}{item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors",
                item.up 
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                  : 'bg-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              )}>
                {item.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span className="tabular-nums font-black">{item.change > 0 ? '+' : ''}{item.change}%</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Extra glow effect */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5" />
    </div>
  );
}
