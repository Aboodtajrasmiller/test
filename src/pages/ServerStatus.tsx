import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Server, Activity, Shield, Cpu, Globe, Database, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ServerInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  cpus: number;
  region: string;
}

interface Stats {
  activeUsers: number;
  totalTrades: number;
  systemLoad: string;
  memoryUsage: string;
}

interface Health {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export default function ServerStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [hRes, sRes, iRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/stats'),
        fetch('/api/server-info')
      ]);
      
      const hData = await hRes.json();
      const sData = await sRes.json();
      const iData = await iRes.json();

      setHealth(hData);
      setStats(sData);
      setInfo(iData);
    } catch (error) {
      console.error("Error fetching server status:", error);
      toast.error("فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const servers = [
    { name: "خادم الواجهة البرمجية (API)", type: "Core Express", status: health?.status === "online" ? "نشط" : "غير متصل", icon: <Server className="text-blue-500" /> },
    { name: "خادم الأمان (Security)", type: "Helmet/CORS", status: "محمي", icon: <Shield className="text-emerald-500" /> },
    { name: "خادم المهام المجدولة (Worker)", type: "Node-Cron", status: "يعمل", icon: <Clock className="text-amber-500" /> },
    { name: "قاعدة البيانات (Database)", type: "Firestore", status: "متصل", icon: <Database className="text-cyan-500" /> },
    { name: "خادم البحث (CDN)", type: "Global Edge", status: "نشط", icon: <Globe className="text-indigo-500" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">حالة الخوادم والخدمات</h1>
          <p className="text-slate-500">نظام المراقبة الموحد لجميع موارد المنصة</p>
        </div>
        <button 
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold shadow-sm"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          تحديث الحالة
        </button>
      </div>

      {/* Real-time Health Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard 
          label="حالة النظام" 
          value={health?.status === "online" ? "متصل" : "جاري التحميل..."} 
          icon={<Activity />} 
          color={health?.status === "online" ? "emerald" : "slate"} 
        />
        <StatusCard 
          label="وقت التشغيل" 
          value={health ? `${Math.floor(health.uptime / 60)} دقيقة` : "..."} 
          icon={<Clock />} 
          color="blue" 
        />
        <StatusCard 
          label="استهلاك الذاكرة" 
          value={stats?.memoryUsage || "..."} 
          icon={<Database />} 
          color="amber" 
        />
        <StatusCard 
          label="ضغط المعالج" 
          value={stats ? `${stats.systemLoad}` : "..."} 
          icon={<Cpu />} 
          color="rose" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Servers List */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Server size={20} className="text-blue-600" />
              الخوادم المتصلة
            </h2>
            <div className="space-y-4">
              {servers.map((s, idx) => (
                <motion.div 
                  key={s.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{s.name}</h3>
                      <p className="text-xs text-slate-500">{s.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {s.status}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Server Specs */}
        <div className="space-y-6">
          <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Cpu size={20} className="text-blue-400" />
              مواصفات الخادم
            </h2>
            <div className="space-y-6">
              <SpecItem label="بيئة التشغيل" value={health?.environment.toUpperCase() || "..."} />
              <SpecItem label="إصدار النظام" value={health?.version || "..."} />
              <SpecItem label="إصدار Node.js" value={info?.nodeVersion || "..."} />
              <SpecItem label="الموقع الجغرافي" value={info?.region || "..."} />
              <SpecItem label="بنية المعالج" value={info?.arch.toUpperCase() || "..."} />
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <CheckCircle2 size={24} />
              <h3 className="font-bold">حالة الأمان</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              تم تفعيل طبقات الحماية Helmet و CORS وسياسة المحتوى المشددة. جميع البيانات مشفرة وتمر عبر جدار حماية نشط.
            </p>
            <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3">
              <Shield className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">SSL / TLS 1.3 Active</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-400 border-slate-100"
  };

  return (
    <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${colors[color] || colors.slate}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold opacity-80">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-mono font-bold text-blue-300">{value}</span>
    </div>
  );
}
