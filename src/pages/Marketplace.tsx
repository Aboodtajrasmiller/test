import { motion } from 'motion/react';
import { Search, Filter, ArrowLeftRight, Users, MessageSquare, Star, MapPin, Clock, CheckCircle, X, Globe as GlobeIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { createTradeRequest } from '../services/tradeService';
import { useTranslation } from 'react-i18next';
import { TranslatableContent } from '../components/TranslatableContent';
import { SKILL_ICONS_MAP } from '../constants';

import { Skill } from '../constants';

export function Marketplace() {
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(t('common.all'));
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCategory(t('common.all'));
  }, [i18n.language]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(20));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
          .filter(u => u.id !== user?.uid) // Don't show current user
          .sort((a, b) => {
            const aPlan = a.subscriptionPlan || 'free';
            const bPlan = b.subscriptionPlan || 'free';
            if (aPlan === 'pro' && bPlan !== 'pro') return -1;
            if (aPlan !== 'pro' && bPlan === 'pro') return 1;
            return 0;
          });
        setUsers(fetchedUsers);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const handleTradeRequest = async (targetUser: any, specificSkill?: string) => {
    if (!user || !profile) {
      toast.error(i18n.language === 'ar' ? "يرجى تسجيل الدخول وإكمال ملفك الشخصي أولاً" : "Please log in and complete your profile first");
      return;
    }

    const confirmed = window.confirm(
      i18n.language === 'ar' 
        ? `هل أنت متأكد من رغبتك في إرسال طلب مقايضة إلى ${targetUser.displayName}؟`
        : `Are you sure you want to send a trade request to ${targetUser.displayName}?`
    );
    if (!confirmed) return;

    setSubmitting(targetUser.id);
    try {
      await createTradeRequest(
        user.uid,
        targetUser.id,
        user.displayName || "مستخدم",
        profile.skillsOffered?.[0]?.name || "خدمات مهنية",
        specificSkill || targetUser.skillsOffered?.[0]?.name || "خدمات مهنية",
        profile.subscriptionPlan || 'free'
      );
      toast.success(
        i18n.language === 'ar'
          ? `تم إرسال طلب المقايضة إلى ${targetUser.displayName}`
          : `Trade request sent to ${targetUser.displayName}`
      );
    } catch (error: any) {
      if (error.message === "LIMIT_REACHED") {
        toast.error(
          i18n.language === 'ar'
            ? "لقد وصلت للحد الأقصى للمقايضات (3) في الخطة المجانية. يرجى الترقية!"
            : "You have reached the maximum trades limit (3) in the free plan. Please upgrade!"
        );
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setSubmitting(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      u.skillsOffered?.some((s: Skill) => s.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || s.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === t('common.all') || 
      u.skillsOffered?.some((s: Skill) => s.category === selectedCategory);
    
    const matchesPlan = planFilter === 'all' || (u.subscriptionPlan || 'free') === planFilter;
    
    const avgRating = u.testimonials?.length > 0 
      ? u.testimonials.reduce((acc: number, t: any) => acc + (t.rating || 0), 0) / u.testimonials.length 
      : 0;
    const matchesRating = ratingFilter === 0 || avgRating >= ratingFilter;
    
    const matchesCountry = countryFilter.length === 0 || (u.country && countryFilter.some(c => u.country.toLowerCase().includes(c.toLowerCase())));

    return matchesSearch && matchesCategory && matchesPlan && matchesRating && matchesCountry;
  });

  const CATEGORIES = [
    t('common.all'),
    "تطوير",
    "تصميم",
    "تسويق",
    "كتابة",
    "أعمال",
    "تعليم",
    "أخرى"
  ];

  return (
    <div className="space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('marketplace.title')}</h1>
          <p className="text-slate-500">{t('marketplace.subtitle')}</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", i18n.language === 'ar' ? 'right-3' : 'left-3')} size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('marketplace.searchPlaceholder')} 
              className={cn(
                "py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 transition-all",
                i18n.language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'
              )}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors",
                  i18n.language === 'ar' ? 'left-2' : 'right-2'
                )}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 border rounded-xl transition-colors flex items-center gap-2 px-4 text-sm font-medium",
              showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter size={18} />
            <span>{t('marketplace.filter')}</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">{t('marketplace.categories')}</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(0, 8).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      selectedCategory === cat 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Filter */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">{t('marketplace.membership')}</label>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: t('common.all') },
                  { id: 'free', label: i18n.language === 'ar' ? 'أساسية' : 'Basic' },
                  { id: 'pro', label: 'Pro' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlanFilter(p.id as any)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                      planFilter === p.id 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">{t('marketplace.rating')}</label>
              <div className="flex flex-col gap-3">
                {[0, 3, 4, 4.5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between",
                      ratingFilter === r 
                        ? "bg-amber-100 text-amber-700 border-amber-200" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <span>{r === 0 ? (i18n.language === 'ar' ? "جميع التقييمات" : "All Ratings") : (i18n.language === 'ar' ? `${r} نجوم فما فوق` : `${r} Stars & Above`)}</span>
                    {r > 0 && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={10} className={cn(
                            star <= r ? "fill-amber-500 text-amber-500" : "text-slate-200"
                          )} />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Filter */}
            <div className="md:col-span-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block italic flex items-center gap-2">
                <Users size={12} />
                {t('marketplace.location')}
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button 
                  onClick={() => setCountryFilter([])}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold border transition-all",
                    countryFilter.length === 0 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {i18n.language === 'ar' ? 'جميع الدول' : 'All Countries'}
                </button>
                {(i18n.language === 'ar' ? ["مصر", "السعودية", "الإمارات", "الأردن", "المغرب", "عالمي"] : ["Egypt", "Saudi Arabia", "UAE", "Jordan", "Morocco", "Global"]).map(c => {
                  const isSelected = countryFilter.includes(c);
                  return (
                    <button 
                      key={c}
                      onClick={() => {
                        if (isSelected) {
                          setCountryFilter(prev => prev.filter(item => item !== c));
                        } else {
                          setCountryFilter(prev => [...prev, c]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold border transition-all",
                        isSelected 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Users className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", i18n.language === 'ar' ? 'right-3' : 'left-3')} size={16} />
                <input 
                  list="countries-list"
                  type="text" 
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !countryFilter.includes(val)) {
                      setCountryFilter(prev => [...prev, val]);
                    }
                  }}
                  placeholder={i18n.language === 'ar' ? "ابحث وأضف دولة أخرى..." : "Search and add another country..."} 
                  className={cn(
                    "py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm",
                    i18n.language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'
                  )}
                />
                <datalist id="countries-list">
                  <option value="مصر" />
                  <option value="السعودية" />
                  <option value="الإمارات" />
                  <option value="الأردن" />
                  <option value="الكويت" />
                  <option value="المغرب" />
                  <option value="تونس" />
                  <option value="الجزائر" />
                  <option value="قطر" />
                  <option value="عمان" />
                  <option value="البحرين" />
                  <option value="لبنان" />
                  <option value="سوريا" />
                  <option value="فلسطين" />
                  <option value="العراق" />
                  <option value="اليمن" />
                  <option value="ليبيا" />
                  <option value="عالمي" />
                </datalist>
              </div>
              
              {countryFilter.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {countryFilter.map(c => (
                    <span 
                      key={c}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100"
                    >
                      {c}
                      <button 
                        onClick={() => setCountryFilter(prev => prev.filter(item => item !== c))}
                        className="p-0.5 hover:bg-blue-100 rounded"
                      >
                        <MapPin size={8} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button 
              onClick={() => {
                setSelectedCategory(t('common.all'));
                setPlanFilter("all");
                setRatingFilter(0);
                setCountryFilter([]);
                setSearchTerm("");
              }}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              {i18n.language === 'ar' ? "إعادة ضبط الفلاتر" : "Reset Filters"}
            </button>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-8">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white p-6 rounded-3xl h-80 border border-slate-50 relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-20 bg-slate-50/50 rounded-2xl animate-pulse" />
                <div className="h-10 bg-slate-50/50 rounded-2xl animate-pulse w-3/4" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400">{i18n.language === 'ar' ? "لم يتم العثور على مقايضين متاحين حالياً." : "No barters found at the moment."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
                    {item.photoURL ? (
                      <img src={item.photoURL} alt={item.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Users size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 flex-wrap">
                        <h3 className="font-bold text-slate-800">{item.displayName}</h3>
                        {item.subscriptionPlan === 'pro' && (
                          <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 rounded uppercase tracking-tighter">PRO</span>
                        )}
                        {item.testimonials?.length >= 3 && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-white bg-emerald-500 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-emerald-500/30 border border-emerald-400 animate-in fade-in zoom-in duration-500">
                            <CheckCircle size={10} className="fill-white text-emerald-500" />
                            <span>{t('marketplace.reliable')}</span>
                          </span>
                        )}
                      </div>
                      {item.username && (
                        <p className="text-[10px] text-blue-600 font-bold tracking-tight">@{item.username}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={10} />
                          <span>{new Date(item.createdAt?.seconds * 1000).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                        </div>
                        {item.country && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            <MapPin size={10} />
                            <span>{item.country}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.portfolioUrl && (
                    <a 
                      href={item.portfolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100"
                      title={i18n.language === 'ar' ? "معرض الأعمال" : "Portfolio"}
                    >
                      <ArrowLeftRight size={16} />
                    </a>
                  )}
                  {item.testimonials?.length > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-100">
                      <Star size={10} className="fill-amber-500" />
                      {(item.testimonials.reduce((acc: number, t: any) => acc + (t.rating || 0), 0) / item.testimonials.length).toFixed(1)}
                    </div>
                  )}
                  {item.testimonials?.length > 0 && (
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                      <MessageSquare size={10} />
                      {item.testimonials.length}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-500 block mb-2">{t('marketplace.skillsOffered')}</span>
                  <div className="space-y-2">
                    {item.skillsOffered?.slice(0, 3).map((s: Skill, idx: number) => {
                      const Icon = s.icon && SKILL_ICONS_MAP[s.icon] ? SKILL_ICONS_MAP[s.icon] : GlobeIcon;
                      return (
                        <div key={idx} className="flex flex-col p-2 bg-blue-50/50 rounded-lg group/skill">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className="text-blue-500" />
                              <span className="text-xs text-slate-700 font-medium">
                                <TranslatableContent content={s.name} />
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTradeRequest(item, s.name);
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 opacity-0 group-hover/skill:opacity-100 transition-opacity"
                              >
                                {t('marketplace.requestTrade')}
                              </button>
                            </div>
                          </div>
                          {s.description && (
                            <TranslatableContent 
                              content={s.description} 
                              className="text-[10px] text-slate-500 mt-1" 
                              autoTranslate 
                            />
                          )}
                        </div>
                      );
                    }) || <p className="text-xs text-slate-400">{i18n.language === 'ar' ? "لا توجد مهارات معروضة" : "No skills offered"}</p>}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-500 block mb-2">{t('marketplace.skillsWanted')}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.skillsWanted?.slice(0, 3).map((s: Skill, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
                        <TranslatableContent content={s.name} />
                      </span>
                    )) || <p className="text-xs text-slate-400">{i18n.language === 'ar' ? "لا توجد طلبات" : "No requests"}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  disabled={submitting === item.id}
                  onClick={() => handleTradeRequest(item)}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-wide hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting === item.id ? (i18n.language === 'ar' ? "جاري الإرسال..." : "Sending...") : t('marketplace.requestTrade')}
                  <ArrowLeftRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
