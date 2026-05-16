import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, Plus, X, Save, Link as LinkIcon, MessageSquare, Quote, Star, Sparkles, Clock, CheckCircle2, XCircle, MapPin, Search, ArrowLeftRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { generateBio, generateSkillDescription, suggestRelatedSkills, searchSkillsAI, suggestSkillIcon } from '../services/geminiService';
import { updateTradeStatus, addTradeReview } from '../services/tradeService';
import { Skill, SKILL_ICONS_MAP, SKILL_ICONS_LIST } from '../constants';

interface Testimonial {
  author: string;
  text: string;
  rating: number;
}

interface Trade {
  id: string;
  senderId: string;
  receiverId: string;
  skillOffered: string;
  skillWanted: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  senderReview?: { rating: number; comment: string; taggedSkill?: string; createdAt: any };
  receiverReview?: { rating: number; comment: string; taggedSkill?: string; createdAt: any };
  createdAt: any;
  updatedAt?: any;
}

const COMMON_SKILLS: Skill[] = [
  { name: "تصميم جرافيك", category: "تصميم" },
  { name: "تطوير ويب", category: "تطوير" },
  { name: "تسويق رقمي", category: "تسويق" },
  { name: "ترجمة", category: "كتابة" },
  { name: "مونتاج فيديو", category: "تصميم" },
  { name: "كتابة محتوى", category: "كتابة" },
  { name: "برمجة تطبيقات", category: "تطوير" },
  { name: "إدارة مشاريع", category: "أعمال" },
  { name: "استشارات مالية", category: "أعمال" },
  { name: "SEO", category: "تسويق" }
];

const CATEGORIES = ["تطوير", "تصميم", "تسويق", "كتابة", "أعمال", "تعليم", "أخرى"];

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sheba",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Cookie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Pepper",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bear",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna"
];

export function Profile() {
  const { user, profile } = useAuth();
  const [offered, setOffered] = useState<Skill[]>([]);
  const [wanted, setWanted] = useState<Skill[]>([]);
  const [offeredSkill, setOfferedSkill] = useState("");
  const [offeredDesc, setOfferedDesc] = useState("");
  const [offeredUrl, setOfferedUrl] = useState("");
  const [offeredIcon, setOfferedIcon] = useState("Sparkles");
  const [offeredCat, setOfferedCat] = useState(CATEGORIES[0]);
  
  const [wantedSkill, setWantedSkill] = useState("");
  const [wantedDesc, setWantedDesc] = useState("");
  const [wantedUrl, setWantedUrl] = useState("");
  const [wantedCat, setWantedCat] = useState(CATEGORIES[0]);
  
  const [username, setUsername] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [country, setCountry] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonialAuthor, setNewTestimonialAuthor] = useState("");
  const [newTestimonialText, setNewTestimonialText] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [offeredSearch, setOfferedSearch] = useState("");
  const [wantedSearch, setWantedSearch] = useState("");
  const [offeredSuggestions, setOfferedSuggestions] = useState<Skill[]>([]);
  const [wantedSuggestions, setWantedSuggestions] = useState<Skill[]>([]);
  const [isSearchingOffered, setIsSearchingOffered] = useState(false);
  const [isSearchingWanted, setIsSearchingWanted] = useState(false);
  const [aiBioLoading, setAiBioLoading] = useState(false);
  const [aiSkillLoading, setAiSkillLoading] = useState(false);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<Skill[]>([]);

  // Trade History
  const [trades, setTrades] = useState<Trade[]>([]);
  const [reviewingTradeId, setReviewingTradeId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedTaggedSkill, setSelectedTaggedSkill] = useState("");
  const [detailsTradeId, setDetailsTradeId] = useState<string | null>(null);
  
  // Delete Confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    type: 'skill' | 'testimonial';
    payload: any;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setOffered(profile.skillsOffered || []);
      setWanted(profile.skillsWanted || []);
      setUsername(profile.username || "");
      setPortfolioUrl(profile.portfolioUrl || "");
      setCountry(profile.country || "");
      setAutoTranslate(profile.autoTranslate || false);
      setCustomAvatarUrl(profile.photoURL || "");
      setTestimonials(profile.testimonials || []);

      // Automatically detect country if missing
      if (!profile.country) {
        handleDetectLocation();
      }
    }
  }, [profile]);

  const handleDetectLocation = async () => {
    if (country && profile?.country) return; // Don't overwrite if already set in profile
    
    setDetectingLocation(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const countryMap: Record<string, string> = {
        'Egypt': 'مصر',
        'Saudi Arabia': 'السعودية',
        'United Arab Emirates': 'الإمارات',
        'Jordan': 'الأردن',
        'Kuwait': 'الكويت',
        'Morocco': 'المغرب',
        'Tunisia': 'تونس',
        'Algeria': 'الجزائر',
        'Qatar': 'قطر',
        'Oman': 'عمان',
        'Bahrain': 'البحرين',
        'Lebanon': 'لبنان',
        'Syria': 'سوريا',
        'Palestine': 'فلسطين',
        'Iraq': 'العراق',
        'Yemen': 'اليمن',
        'Libya': 'ليبيا'
      };

      const detectedCountry = countryMap[data.country_name] || data.country_name;
      if (detectedCountry) {
        setCountry(detectedCountry);
        toast.success(`تم تحديد موقعك تلقائياً: ${detectedCountry}`);
      }
    } catch (error) {
      console.error("Failed to detect location:", error);
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Fetch trades where user is sender
    const tradesRef = collection(db, 'trades');
    const q1 = query(tradesRef, where('senderId', '==', user.uid), orderBy('createdAt', 'desc'));
    const q2 = query(tradesRef, where('receiverId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsub1 = onSnapshot(q1, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
      setTrades(prev => {
        const others = prev.filter(t => t.senderId !== user.uid);
        return [...fetched, ...others].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });
    });

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
      setTrades(prev => {
        const others = prev.filter(t => t.receiverId !== user.uid);
        return [...fetched, ...others].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield size={64} className="text-slate-200 mb-6" />
        <h2 className="text-2xl font-bold text-slate-400">يرجى تسجيل الدخول لعرض ملفك الشخصي</h2>
      </div>
    );
  }

  const handleUpdateProfile = async (field: string, value: any) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { [field]: value });
      toast.success("تم تحديث البيانات");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAIBio = async () => {
    if (offered.length === 0) {
      toast.error("أضف مهاراتك أولاً لنتمكن من توليد نبذة مناسبة");
      return;
    }
    setAiBioLoading(true);
    try {
      const generated = await generateBio(offered);
      if (generated) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { bio: generated });
        toast.success("تم توليد النبذة بالذكاء الاصطناعي");
      }
    } catch (error) {
      console.error(error);
      toast.error("فشل توليد النبذة");
    } finally {
      setAiBioLoading(false);
    }
  };

  const handleAISkillDesc = async (type: 'offered' | 'wanted') => {
    const skillName = type === 'offered' ? offeredSkill : wantedSkill;
    const category = type === 'offered' ? offeredCat : wantedCat;
    
    if (!skillName) {
      toast.error("اكتب اسم المهارة أولاً");
      return;
    }
    
    setAiSkillLoading(true);
    try {
      const descPromise = generateSkillDescription(skillName, category);
      const iconPromise = type === 'offered' ? suggestSkillIcon(skillName, category) : Promise.resolve(null);
      
      const [desc, icon] = await Promise.all([descPromise, iconPromise]);
      
      if (desc) {
        if (type === 'offered') setOfferedDesc(desc);
        else setWantedDesc(desc);
      }
      if (icon) {
        setOfferedIcon(icon);
      }
      toast.success("تم توليد التفاصيل");
    } catch (error) {
      console.error(error);
      toast.error("فشل توليد الوصف");
    } finally {
      setAiSkillLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (offered.length === 0 && wanted.length === 0) {
      toast.error("أضف بعض المهارات أولاً نتمكن من تقديم اقتراحات");
      return;
    }
    setAiSuggestionsLoading(true);
    try {
      const suggestions = await suggestRelatedSkills(offered, wanted);
      setSuggestedSkills(suggestions);
      toast.success("تم العثور على مهارات قد تهمك!");
    } catch (error) {
      console.error(error);
      toast.error("فشل الحصول على اقتراحات");
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  const handleAISearch = async (keyword: string, type: 'offered' | 'wanted') => {
    if (!keyword || keyword.length < 2) return;
    if (type === 'offered') setIsSearchingOffered(true);
    else setIsSearchingWanted(true);
    
    try {
      const results = await searchSkillsAI(keyword);
      if (type === 'offered') setOfferedSuggestions(results);
      else setWantedSuggestions(results);
    } catch (error) {
      console.error(error);
    } finally {
      if (type === 'offered') setIsSearchingOffered(false);
      else setIsSearchingWanted(false);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonialAuthor || !newTestimonialText) return;
    const updatedTestimonials = [...testimonials, { author: newTestimonialAuthor, text: newTestimonialText, rating: 5 }];
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { testimonials: updatedTestimonials });
      setTestimonials(updatedTestimonials);
      setNewTestimonialAuthor("");
      setNewTestimonialText("");
      toast.success("تم إضافة التوصية");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTestimonial = async (index: number) => {
    if (!showConfirm) {
      setConfirmData({ type: 'testimonial', payload: index });
      setShowConfirm(true);
      return;
    }

    const updatedTestimonials = testimonials.filter((_, i) => i !== index);
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { testimonials: updatedTestimonials });
      setTestimonials(updatedTestimonials);
      toast.success("تم حذف التوصية");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setConfirmData(null);
    }
  };

  const handleUpdateSkills = async (type: 'offered' | 'wanted', action: 'add' | 'remove', skillObj?: Skill) => {
    if (action === 'remove' && !showConfirm) {
      setConfirmData({ type: 'skill', payload: { type, skillObj } });
      setShowConfirm(true);
      return;
    }

    const skillNameToAdd = skillObj?.name || (type === 'offered' ? offeredSkill : wantedSkill);
    const categoryToAdd = skillObj?.category || (type === 'offered' ? offeredCat : wantedCat);
    const descriptionToAdd = skillObj?.description || (type === 'offered' ? offeredDesc : wantedDesc);
    const urlToAdd = skillObj?.url || (type === 'offered' ? offeredUrl : wantedUrl);
    const iconToAdd = skillObj?.icon || (type === 'offered' ? offeredIcon : undefined);
    
    if (action === 'add' && !skillNameToAdd) return;
    
    setLoading(true);
    let updatedOffered = [...offered];
    let updatedWanted = [...wanted];

    if (type === 'offered') {
      if (action === 'add') {
        if (!updatedOffered.find(s => s.name === skillNameToAdd)) {
          updatedOffered.push({ name: skillNameToAdd, category: categoryToAdd, description: descriptionToAdd, url: urlToAdd, icon: iconToAdd });
        }
      }
      else if (skillObj) {
        updatedOffered = updatedOffered.filter(s => s.name !== skillObj.name);
      }
    } else {
      if (action === 'add') {
        if (!updatedWanted.find(s => s.name === skillNameToAdd)) {
          updatedWanted.push({ name: skillNameToAdd, category: categoryToAdd, description: descriptionToAdd, url: urlToAdd });
        }
      }
      else if (skillObj) {
        updatedWanted = updatedWanted.filter(s => s.name !== skillObj.name);
      }
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        skillsOffered: updatedOffered,
        skillsWanted: updatedWanted
      });
      setOffered(updatedOffered);
      setWanted(updatedWanted);
      if (!skillObj) {
        if (type === 'offered') {
          setOfferedSkill("");
          setOfferedDesc("");
          setOfferedUrl("");
          setOfferedIcon("Sparkles");
        } else {
          setWantedSkill("");
          setWantedDesc("");
          setWantedUrl("");
        }
      }
      toast.success("تم التحديث بنجاح");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setConfirmData(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 relative overflow-hidden border-4 border-white shadow-xl">
              {profile?.photoURL || user.photoURL ? (
                <img src={profile?.photoURL || user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={64} />
              )}
            </div>
            <button 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full shadow-lg hover:bg-black transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-right w-full">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                   {user.displayName}
                   {profile?.subscriptionPlan === 'pro' && <Shield className="text-amber-500" size={20} />}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold text-sm">@</span>
                  <input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    onBlur={() => handleUpdateProfile('username', username)}
                    placeholder="اسم_المستخدم"
                    className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-sm font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                  />
                  <button onClick={() => handleUpdateProfile('username', username)} className="p-1 hover:bg-slate-50 rounded text-slate-400">
                    <Save size={14} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={handleAIBio}
                disabled={aiBioLoading || offered.length === 0}
                className="p-1 px-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                title="توليد نبذة باستخدام الذكاء الاصطناعي"
              >
                <Sparkles size={14} className={aiBioLoading ? "animate-spin" : ""} />
                {aiBioLoading ? "جاري التوليد..." : "تحسين بالذكاء الاصطناعي"}
              </button>
            </div>
            <p className="text-slate-500 mb-6 leading-relaxed max-w-2xl">{profile?.bio || "لا يوجد وصف مدخل حتى الآن. أضف مهاراتك ثم استخدم زر التحسين بالذكاء الاصطناعي!"}</p>
            
            {showAvatarPicker && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">تحديث صورة البروفايل</h3>
                  <button onClick={() => setShowAvatarPicker(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">اختر شخصية رمزية:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {PREDEFINED_AVATARS.map((avatar, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            handleUpdateProfile('photoURL', avatar);
                            setShowAvatarPicker(false);
                          }}
                          className={cn(
                            "w-12 h-12 rounded-2xl border-2 transition-all p-1 overflow-hidden bg-white shadow-sm",
                            profile?.photoURL === avatar ? "border-blue-500 ring-4 ring-blue-50" : "border-transparent hover:border-slate-300"
                          )}
                        >
                          <img src={avatar} alt="avatar" className="w-full h-full rounded-xl" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">أو استخدم رابط صورة مخصص:</span>
                    <div className="flex gap-2">
                      <input 
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        placeholder="أدخل رابط الصورة (URL)..." 
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                      <button 
                        onClick={() => {
                          handleUpdateProfile('photoURL', customAvatarUrl);
                          setShowAvatarPicker(false);
                        }}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
                      >
                        حفظ الرابط
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2 text-right">ملاحظة: يمكنك استخدام روابط من Unsplash أو أي خدمة استضافة صور.</p>
                  </div>
                </div>
              </motion.div>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <Shield size={16} />
                <span>حساب موثق</span>
              </div>
              {portfolioUrl && (
                <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <LinkIcon size={16} />
                  <span>معرض الأعمال</span>
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
              <div className="relative flex-1 max-w-[250px]">
                <input 
                  list="countries-list"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="الدولة (على سبيل المثال: مصر، السعودية، عالمي)..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <button 
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-50"
                  title="تحديد الموقع تلقائياً"
                >
                  <MapPin size={14} className={detectingLocation ? "animate-pulse text-blue-500" : ""} />
                </button>
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
                  <option value="الرياض" />
                  <option value="دبي" />
                  <option value="القاهرة" />
                  <option value="عالمي" />
                </datalist>
                <button 
                  onClick={() => handleUpdateProfile('country', country)}
                  className="absolute left-2 top-1.5 p-1 text-slate-400 hover:text-slate-900"
                >
                  <Save size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">ترجمة تلقائية:</span>
                <button 
                  onClick={() => {
                    const newVal = !autoTranslate;
                    setAutoTranslate(newVal);
                    handleUpdateProfile('autoTranslate', newVal);
                  }}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    autoTranslate ? "bg-blue-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                    autoTranslate ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
              
              <div className="relative flex-1 max-w-[250px]">
                <input 
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="رابط معرض الأعمال (Portfolio URL)..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={() => handleUpdateProfile('portfolioUrl', portfolioUrl)}
                  className="absolute left-2 top-1.5 p-1 text-slate-400 hover:text-slate-900"
                >
                  <Save size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="text-blue-500" />
            توصيات وشهادات العملاء
          </h2>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <input 
                value={newTestimonialAuthor}
                onChange={(e) => setNewTestimonialAuthor(e.target.value)}
                placeholder="اسم صاحب التوصية..." 
                className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea 
                value={newTestimonialText}
                onChange={(e) => setNewTestimonialText(e.target.value)}
                placeholder="نص التوصية..." 
                rows={2}
                className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button 
                disabled={loading || !newTestimonialAuthor || !newTestimonialText}
                onClick={handleAddTestimonial}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                إضافة توصية
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {testimonials.length === 0 ? (
              <p className="text-slate-400 text-sm italic text-center py-4">لم يتم إضافة توصيات بعد.</p>
            ) : (
              testimonials.map((t, index) => (
                <div key={index} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <Quote size={32} className="absolute top-4 left-4 text-slate-200" />
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={12} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-slate-600 mb-3 italic relative z-10 leading-relaxed">"{t.text}"</p>
                  <p className="text-xs font-bold text-slate-800">— {t.author}</p>
                  
                  <button 
                    onClick={() => handleRemoveTestimonial(index)}
                    className="absolute top-4 right-4 p-1 bg-red-100 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Skills Offered */}
        <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">مهاراتي التي أعرضها</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-medium">ما الذي تتقنه وتريد مقايضته؟</p>
          
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input 
                  value={offeredSkill}
                  onChange={(e) => setOfferedSkill(e.target.value)}
                  placeholder="اسم المهارة..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <textarea 
                  value={offeredDesc}
                  onChange={(e) => setOfferedDesc(e.target.value)}
                  placeholder="وصف مختصر للمهارة (خبرتك، ما يمكنك فعله)..." 
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
                <input 
                  value={offeredUrl}
                  onChange={(e) => setOfferedUrl(e.target.value)}
                  placeholder="رابط للمهارة (مثلاً: ملف أعمال، فيديو، موقع)..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">اختر أيقونة للمهارة:</span>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    {SKILL_ICONS_LIST.map(iconName => {
                      const IconComp = SKILL_ICONS_MAP[iconName];
                      return (
                        <button 
                          key={iconName}
                          onClick={() => setOfferedIcon(iconName)}
                          className={cn(
                            "p-2 rounded-xl border transition-all",
                            offeredIcon === iconName ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <IconComp size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={() => handleAISkillDesc('offered')}
                  disabled={aiSkillLoading || !offeredSkill}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 disabled:opacity-50"
                >
                  <Sparkles size={10} className={aiSkillLoading ? "animate-spin" : ""} />
                  توليد وصف تلقائي
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <select 
                  value={offeredCat}
                  onChange={(e) => setOfferedCat(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button 
                  disabled={loading}
                  onClick={() => handleUpdateSkills('offered', 'add')}
                  className="flex-1 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center p-2"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">ابحث عن مهارات لإضافتها:</span>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text"
                value={offeredSearch}
                onChange={(e) => {
                  setOfferedSearch(e.target.value);
                  if (e.target.value.length === 0) setOfferedSuggestions([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAISearch(offeredSearch, 'offered');
                }}
                placeholder="ابحث في المهارات الشائعة أو اضغط Enter للبحث بالذكاء الاصطناعي..."
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
              {offeredSearch.length > 2 && (
                <button 
                  onClick={() => handleAISearch(offeredSearch, 'offered')}
                  disabled={isSearchingOffered}
                  className="absolute left-2 top-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {isSearchingOffered ? "جاري البحث..." : "بحث ذكي"}
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {/* Filtered Common Skills */}
              {COMMON_SKILLS
                .filter(s => !offered.find(o => o.name === s.name))
                .filter(s => s.name.toLowerCase().includes(offeredSearch.toLowerCase()) || s.category.toLowerCase().includes(offeredSearch.toLowerCase()))
                .map(s => (
                <button 
                  key={s.name} 
                  onClick={() => handleUpdateSkills('offered', 'add', s)}
                  className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center gap-1"
                >
                  {s.name}
                  <span className="text-[9px] opacity-60">({s.category})</span>
                  <span>+</span>
                </button>
              ))}

              {/* AI Search Suggestions */}
              {offeredSuggestions.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-4 w-full">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">نتائج البحث الذكي:</span>
                  {offeredSuggestions.map((s, idx) => (
                    <motion.div 
                      key={`ai-offered-result-${idx}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start justify-between group hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-blue-900">{s.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-bold">{s.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{s.description}</p>
                      </div>
                      <button 
                        onClick={() => {
                          handleUpdateSkills('offered', 'add', s);
                          setOfferedSuggestions(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 active:scale-95"
                        title="إضافة للملف"
                      >
                        <Plus size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {offeredSearch.length > 2 && COMMON_SKILLS.filter(s => s.name.includes(offeredSearch)).length === 0 && offeredSuggestions.length === 0 && !isSearchingOffered && (
                <button 
                  onClick={() => {
                    setOfferedSkill(offeredSearch);
                    setOfferedSearch("");
                  }}
                  className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  استخدام "{offeredSearch}" كمهارة مخصصة
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
            {offered.map((s) => (
              <SkillBadge key={s.name} skill={s} color="blue" onRemove={() => handleUpdateSkills('offered', 'remove', s)} />
            ))}
          </div>
        </section>

        {/* Skills Wanted */}
        <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">مهارات أحتاج إليها</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-medium">ما هي الخدمات التي تبحث عنها؟</p>

          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input 
                  value={wantedSkill}
                  onChange={(e) => setWantedSkill(e.target.value)}
                  placeholder="اسم الخدمة المطلوبة..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                <textarea 
                  value={wantedDesc}
                  onChange={(e) => setWantedDesc(e.target.value)}
                  placeholder="وصف لما تبحث عنه بالضبط..." 
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
                />
                <input 
                  value={wantedUrl}
                  onChange={(e) => setWantedUrl(e.target.value)}
                  placeholder="رابط مرجعي للخدمة المطلوبة (اختياري)..." 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
                <button 
                  onClick={() => handleAISkillDesc('wanted')}
                  disabled={aiSkillLoading || !wantedSkill}
                  className="flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-700 disabled:opacity-50"
                >
                  <Sparkles size={10} className={aiSkillLoading ? "animate-spin" : ""} />
                  توليد وصف تلقائي
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <select 
                  value={wantedCat}
                  onChange={(e) => setWantedCat(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button 
                  disabled={loading}
                  onClick={() => handleUpdateSkills('wanted', 'add')}
                  className="flex-1 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center p-2"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">ابحث عن خدمات تحتاجها:</span>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text"
                value={wantedSearch}
                onChange={(e) => {
                  setWantedSearch(e.target.value);
                  if (e.target.value.length === 0) setWantedSuggestions([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAISearch(wantedSearch, 'wanted');
                }}
                placeholder="ابحث في الخدمات الشائعة أو اضغط Enter للبحث بالذكاء الاصطناعي..."
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
              {wantedSearch.length > 2 && (
                <button 
                  onClick={() => handleAISearch(wantedSearch, 'wanted')}
                  disabled={isSearchingWanted}
                  className="absolute left-2 top-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  {isSearchingWanted ? "جاري البحث..." : "بحث ذكي"}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {/* Filtered Common Skills */}
              {COMMON_SKILLS
                .filter(s => !wanted.find(o => o.name === s.name))
                .filter(s => s.name.toLowerCase().includes(wantedSearch.toLowerCase()) || s.category.toLowerCase().includes(wantedSearch.toLowerCase()))
                .map(s => (
                <button 
                  key={s.name} 
                  onClick={() => handleUpdateSkills('wanted', 'add', s)}
                  className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-xs hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100 transition-all flex items-center gap-1"
                >
                  {s.name}
                  <span className="text-[9px] opacity-60">({s.category})</span>
                  <span>+</span>
                </button>
              ))}

              {/* AI Search Suggestions */}
              {wantedSuggestions.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-4 w-full">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">نتائج البحث الذكي:</span>
                  {wantedSuggestions.map((s, idx) => (
                    <motion.div 
                      key={`ai-wanted-result-${idx}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start justify-between group hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-amber-900">{s.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full font-bold">{s.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{s.description}</p>
                      </div>
                      <button 
                        onClick={() => {
                          handleUpdateSkills('wanted', 'add', s);
                          setWantedSuggestions(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-md shadow-amber-600/10 active:scale-95"
                        title="إضافة للملف"
                      >
                        <Plus size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {wantedSearch.length > 2 && COMMON_SKILLS.filter(s => s.name.includes(wantedSearch)).length === 0 && wantedSuggestions.length === 0 && !isSearchingWanted && (
                <button 
                  onClick={() => {
                    setWantedSkill(wantedSearch);
                    setWantedSearch("");
                  }}
                  className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  استخدام "{wantedSearch}" كمهارة مخصصة
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
            {wanted.map((s) => (
              <SkillBadge key={s.name} skill={s} color="amber" onRemove={() => handleUpdateSkills('wanted', 'remove', s)} />
            ))}
          </div>
        </section>
      </div>

      {/* AI Skill Suggestions */}
      <section className={cn(
        "bg-white rounded-3xl border border-slate-100 p-8 shadow-sm relative overflow-hidden transition-all",
        aiSuggestionsLoading && "opacity-70 grayscale-[0.5]"
      )}>
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Sparkles size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
          <div>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Sparkles className="text-blue-500" size={24} />
              اكتشاف مهارات جديدة
            </h2>
            <p className="text-xs text-slate-400 font-medium">دع الذكاء الاصطناعي يقترح عليك مهارات تكمل بروفايلك</p>
          </div>
          <button 
            onClick={handleGetSuggestions}
            disabled={aiSuggestionsLoading}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50 shadow-xl shadow-slate-900/10"
          >
            {aiSuggestionsLoading ? "جاري التحليل..." : "توليد اقتراحات ذكية"}
            <Sparkles size={16} className={aiSuggestionsLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {suggestedSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {suggestedSkills.map((s, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group relative hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 bg-white border border-slate-100 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {s.category}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateSkills('offered', 'add', s)}
                      className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-[10px] font-bold flex items-center gap-1"
                      title="أضف لمهاراتك المعروضة"
                    >
                      <Plus size={12} />
                      أقدمها
                    </button>
                    <button 
                      onClick={() => handleUpdateSkills('wanted', 'add', s)}
                      className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-[10px] font-bold flex items-center gap-1"
                      title="أضف لمهاراتك المطلوبة"
                    >
                      <Plus size={12} />
                      أحتاجها
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{s.name}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        ) : !aiSuggestionsLoading && (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
            <Sparkles size={32} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-400 text-xs">اضغط على الزر أعلاه للحصول على اقتراحات مهارات مخصصة لك</p>
          </div>
        )}
      </section>

      {/* Past Completed Trades & Success Stories */}
      <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Star className="text-amber-500 fill-amber-500" />
          المقايضات المكتملة وتقييمات النجاح
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trades.filter(t => t.status === 'completed').length === 0 ? (
            <div className="md:col-span-2 text-center py-12 border-2 border-dashed border-slate-50 rounded-3xl">
              <CheckCircle2 size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-slate-400 text-xs text-center">أكمل أول مقايضة لك لتحصل على مراجعات من شركائك وتظهر هنا كقصة نجاح!</p>
            </div>
          ) : (
            trades.filter(t => t.status === 'completed').map((t) => {
              const isSender = t.senderId === user.uid;
              const receivedReview = isSender ? t.receiverReview : t.senderReview;
              const myReview = isSender ? t.senderReview : t.receiverReview;
              const targetUserId = isSender ? t.receiverId : t.senderId;
              
              return (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 shadow-sm relative space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        receivedReview ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                      )}>
                        <Star size={24} className={receivedReview ? "fill-amber-500" : ""} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{isSender ? t.skillWanted : t.skillOffered}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">مقابل: {isSender ? t.skillOffered : t.skillWanted}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      مكتملة
                    </span>
                  </div>

                  {/* Received Review */}
                  {receivedReview ? (
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase">ما قاله الشريك عنك:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={12} className={cn(
                            star <= receivedReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-100"
                          )} />
                        ))}
                      </div>
                      {receivedReview.taggedSkill && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-bold">
                             عن مهارة: {receivedReview.taggedSkill}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-slate-600 italic leading-relaxed">"{receivedReview.comment || "تمت المقايضة بنجاح"}"</p>
                    </div>
                  ) : (
                    <div className="py-2 px-4 bg-slate-100/50 rounded-xl">
                      <p className="text-[10px] text-slate-400 italic">في انتظار تقييم الشريك...</p>
                    </div>
                  )}

                  {/* My Review Action or Display */}
                  {myReview ? (
                    <div className="pt-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase mb-1 block">تقييمك للشريك:</span>
                       <div className="flex items-center gap-2">
                         <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={10} className={cn(
                                star <= myReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-100"
                              )} />
                            ))}
                         </div>
                         {myReview.taggedSkill && (
                           <span className="text-[9px] text-slate-400 font-bold">({myReview.taggedSkill})</span>
                         )}
                         <p className="text-[10px] text-slate-500 truncate italic">"{myReview.comment}"</p>
                       </div>
                    </div>
                  ) : reviewingTradeId === t.id ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3"
                    >
                      <p className="text-[10px] font-bold text-blue-600">كيف كانت تجربتك؟</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setReviewRating(star)}>
                            <Star size={20} className={cn(star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 block">ربط التقييم بمهارة محددة (اختياري):</label>
                        <select 
                          value={selectedTaggedSkill}
                          onChange={(e) => setSelectedTaggedSkill(e.target.value)}
                          className="w-full p-2 bg-white border border-blue-100 rounded-xl text-[10px] focus:outline-none"
                        >
                          <option value="">بدون تحديد</option>
                          <option value={t.skillOffered}>{t.skillOffered}</option>
                          <option value={t.skillWanted}>{t.skillWanted}</option>
                        </select>
                      </div>

                      <textarea 
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="اترك تعليقاً للشريك..."
                        className="w-full p-2 bg-white border border-blue-100 rounded-xl text-xs focus:outline-none min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              await addTradeReview(t.id, user.uid, targetUserId, isSender, reviewRating, reviewComment, selectedTaggedSkill);
                              setReviewingTradeId(null);
                              toast.success("شكراً لتقييمك!");
                            } catch (e) { toast.error("فشل إرسال التقييم"); }
                          }}
                          className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700"
                        >
                          إرسال التقييم
                        </button>
                        <button onClick={() => setReviewingTradeId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">إلغاء</button>
                      </div>
                    </motion.div>
                  ) : (
                    <button 
                      onClick={() => {
                        setReviewingTradeId(t.id);
                        setReviewRating(5);
                        setReviewComment("");
                        setSelectedTaggedSkill("");
                      }}
                      className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
                    >
                      <Star size={14} className="fill-white" />
                      اترك تقييماً للطرف الآخر
                    </button>
                  )}
                  
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] text-slate-400">
                      {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('ar-SA') : ""}
                    </span>
                    <button 
                      onClick={() => setDetailsTradeId(t.id)}
                      className="text-[9px] font-bold text-blue-500 hover:underline"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* Trade Details Modal */}
      <AnimatePresence>
        {detailsTradeId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setDetailsTradeId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">تفاصيل المقايضة</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">سجل التبادل الكامل</p>
                  </div>
                  <button 
                    onClick={() => setDetailsTradeId(null)}
                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {(() => {
                  const t = trades.find(tr => tr.id === detailsTradeId);
                  if (!t) return null;
                  const isSender = t.senderId === user.uid;

                  return (
                    <div className="space-y-8">
                      {/* Skills Exchanged */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                              <ArrowLeftRight size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-blue-400 uppercase">المهارة التي قدمتها</p>
                              <h4 className="font-black text-blue-900">{isSender ? t.skillOffered : t.skillWanted}</h4>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                              <ArrowLeftRight size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-amber-400 uppercase">المهارة التي حصلت عليها</p>
                              <h4 className="font-black text-amber-900">{isSender ? t.skillWanted : t.skillOffered}</h4>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reviews Summary */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <Star size={16} className="text-amber-500 fill-amber-500" />
                           التقييمات المتبادلة
                        </h3>
                        
                        <div className="space-y-3">
                          {/* Partner Review */}
                          <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">تقييم الشريك لك:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} size={10} className={cn(
                                    star <= (isSender ? t.receiverReview?.rating || 0 : t.senderReview?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                  )} />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 italic">"{(isSender ? t.receiverReview?.comment : t.senderReview?.comment) || "لا يوجد تعليق"}"</p>
                            {(isSender ? t.receiverReview?.taggedSkill : t.senderReview?.taggedSkill) && (
                              <span className="inline-block mt-2 text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                 # {isSender ? t.receiverReview?.taggedSkill : t.senderReview?.taggedSkill}
                              </span>
                            )}
                          </div>

                          {/* My Review */}
                          <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">تقييمك للشريك:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} size={10} className={cn(
                                    star <= (isSender ? t.senderReview?.rating || 0 : t.receiverReview?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                  )} />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 italic">"{(isSender ? t.senderReview?.comment : t.receiverReview?.comment) || "لم تترك تقييماً بعد"}"</p>
                            {(isSender ? t.senderReview?.taggedSkill : t.receiverReview?.taggedSkill) && (
                              <span className="inline-block mt-2 text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                 # {isSender ? t.senderReview?.taggedSkill : t.receiverReview?.taggedSkill}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock size={16} />
                          <span className="text-[10px] font-bold">تاريخ البدء: {new Date(t.createdAt.seconds * 1000).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Calendar size={16} />
                          <span className="text-[10px] font-bold">تم الإكمال بنجاح</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">هل أنت متأكد؟</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                هل تريد حقاً حذف {confirmData?.type === 'skill' ? 'هذه المهارة' : 'هذه التوصية'}؟ لا يمكنك التراجع عن هذا الإجراء.
              </p>
              
              <div className="flex gap-3">
                <button 
                  disabled={loading}
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  disabled={loading}
                  onClick={() => {
                    if (confirmData?.type === 'testimonial') {
                      handleRemoveTestimonial(confirmData.payload);
                    } else if (confirmData?.type === 'skill') {
                      handleUpdateSkills(confirmData.payload.type, 'remove', confirmData.payload.skillObj);
                    }
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  {loading ? "جاري الحذف..." : "نعم، احذف"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Clock className="text-slate-400" />
          إدارة المقايضات الجارية
        </h2>
        
        <div className="space-y-4">
          {trades.filter(t => t.status !== 'completed').length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-300 mb-2 flex justify-center">
                <Plus size={48} className="opacity-20" />
              </div>
              <p className="text-slate-400">لا توجد مقايضات جارية حالياً.</p>
            </div>
          ) : (
            trades.filter(t => t.status !== 'completed').map((t) => {
              const isSender = t.senderId === user.uid;
              const targetUserId = isSender ? t.receiverId : t.senderId;
              
              return (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          t.status === 'accepted' ? "bg-blue-100 text-blue-600" :
                          t.status === 'declined' ? "bg-red-100 text-red-600" :
                          "bg-amber-100 text-amber-600"
                        )}>
                          {t.status === 'accepted' ? "مقبولة" :
                           t.status === 'declined' ? "مرفوضة" : "قيد الانتظار"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.createdAt?.seconds * 1000).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900">
                        {t.skillOffered} مقابل {t.skillWanted}
                      </h3>
                    </div>

                    <div className="flex gap-2 items-center">
                      {t.status === 'pending' && !isSender && (
                        <>
                          <button 
                            onClick={() => updateTradeStatus(t.id, user.uid, targetUserId, 'accepted')}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-xs font-bold flex items-center gap-2"
                          >
                            <CheckCircle2 size={16} />
                            قبول
                          </button>
                          <button 
                            onClick={() => updateTradeStatus(t.id, user.uid, targetUserId, 'declined')}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-xs font-bold flex items-center gap-2"
                          >
                            <XCircle size={16} />
                            رفض
                          </button>
                        </>
                      )}
                      {t.status === 'accepted' && (
                        <button 
                          onClick={() => updateTradeStatus(t.id, user.uid, targetUserId, 'completed')}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} />
                          تحديد كمكتملة
                        </button>
                      )}
                      {t.status === 'pending' && isSender && (
                        <span className="text-[10px] text-slate-400 italic">بانتظار رد الشريك...</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function SkillBadge({ skill, color, onRemove }: { skill: Skill; color: 'blue' | 'amber', onRemove: () => any; key?: any }) {
  const styles = color === 'blue' 
    ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50/50" 
    : "bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-50/50";
    
  const IconComp = skill.icon && SKILL_ICONS_MAP[skill.icon] ? SKILL_ICONS_MAP[skill.icon] : Sparkles;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-4 py-3 rounded-2xl text-xs font-medium border flex items-start gap-4 w-full ${styles}`}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
        color === 'blue' ? "bg-white text-blue-600" : "bg-white text-amber-600"
      )}>
        <IconComp size={20} />
      </div>
      <div className="flex-1 flex flex-col gap-1 text-right">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{skill.name}</span>
          <span className="text-[10px] opacity-70 font-normal px-1.5 py-0.5 rounded-full border border-current">#{skill.category}</span>
        </div>
        {skill.description && (
          <p className="text-[11px] opacity-80 leading-relaxed font-normal">{skill.description}</p>
        )}
        {skill.url && (
          <a 
            href={skill.url.startsWith('http') ? skill.url : `https://${skill.url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold underline flex items-center gap-1 mt-1 opacity-80 hover:opacity-100"
          >
            <LinkIcon size={10} />
            رابط المهارة
          </a>
        )}
      </div>
      <button onClick={onRemove} className="hover:opacity-60 transition-opacity p-1 rounded-lg hover:bg-red-50 hover:text-red-500 shrink-0">
        <X size={16} />
      </button>
    </motion.div>
  );
}
