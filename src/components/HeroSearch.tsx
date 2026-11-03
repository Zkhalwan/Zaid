import React from 'react';
import { Search, X, Filter, Sparkles, Video, Image as ImageIcon, Code, Mic, Bot } from 'lucide-react';
import { CATEGORIES, ToolCategory } from '../data/toolsData';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: ToolCategory;
  onCategoryChange: (cat: ToolCategory) => void;
  selectedPricing: string;
  onPricingChange: (pricing: string) => void;
  totalToolsCount: number;
  filteredCount: number;
  onOpenAdvisor?: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  selectedPricing,
  onPricingChange,
  totalToolsCount,
  filteredCount,
  onOpenAdvisor,
}) => {
  const quickSearches = [
    'توليد فيديو',
    'تصميم صور',
    'محرر أكواد',
    'استنساخ صوت',
    'تلخيص كتب ومستندات',
    'شات ذكي',
  ];

  return (
    <section className="w-full pt-6 pb-8 px-2 sm:px-4 flex flex-col items-center text-center">
      {/* 1. Main Hero Visual Banner Showcase */}
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl mb-8 group bg-slate-900">
        <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full overflow-hidden bg-slate-950">
          <img
            src="/src/assets/images/hero_ai_tools_hub_1793631662545.jpg"
            alt="استوديو وموسوعة أدوات الذكاء الاصطناعي"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 brightness-95 contrast-105"
          />
          {/* Subtle multi-layer gradient scrim for supreme legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-950/70" />

          {/* Floating Badges overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>موسوعة شاملة ومحدثة 2026</span>
            </span>
          </div>

          {/* Bottom Banner Content Bar */}
          <div className="absolute bottom-4 sm:bottom-6 right-6 left-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-right">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                مركز الابتكار والتعلم الرقمي
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                كل أدوات الذكاء الاصطناعي في منصة واحدة
              </h2>
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-300 mt-2 font-medium">
                <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-amber-400" /> فيديو</span>
                <span>·</span>
                <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> صور</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Code className="w-3.5 h-3.5 text-sky-400" /> برمجة</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5 text-rose-400" /> صوتيات</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5 text-emerald-400" /> نصوص</span>
              </div>
            </div>

            {onOpenAdvisor && (
              <button
                onClick={onOpenAdvisor}
                className="px-4 py-2 bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all backdrop-blur-xs flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>جرّب المستشار الذكي</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Editorial Headline & Subtitle */}
      <div className="max-w-3xl flex flex-col items-center gap-2.5">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight text-balance">
          دليلك الشامل لتعلم واحتراف أدوات الذكاء الاصطناعي
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          شروحات فيديو تطبيقية خطوة بخطوة، روابط مباشرة، نماذج برومبت جاهزة للاستخدام، ومقارنات موضوعية بين الأدوات العالمية.
        </p>
      </div>

      {/* 3. Main Search Bar */}
      <div className="w-full max-w-2xl mt-6">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث بالاسم، التخصص، أو الميزة (مثال: فيديو سينمائي، كود، صوت، Midjourney)..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl py-3.5 pr-12 pl-12 text-sm text-slate-100 placeholder-slate-500 shadow-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white absolute left-4"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-3 text-xs">
          <span className="text-slate-500">عمليات بحث شائعة:</span>
          {quickSearches.map((tag) => (
            <button
              key={tag}
              onClick={() => onSearchChange(tag)}
              className="text-slate-400 hover:text-amber-300 hover:underline transition-colors"
            >
              {tag} ·
            </button>
          ))}
        </div>
      </div>

      {/* 4. Categories & Filter Bar */}
      <div className="w-full max-w-5xl mt-7 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-b border-slate-800/80 py-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Pricing Filter and Counter */}
        <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>السعر:</span>
            <select
              value={selectedPricing}
              onChange={(e) => onPricingChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="all">الكل</option>
              <option value="مجاني بالكامل">مجاني بالكامل</option>
              <option value="خطة مجانية متوفرة">خطة مجانية متوفرة</option>
              <option value="مدفوع">مدفوع</option>
            </select>
          </div>

          <span className="font-mono tabular-nums text-slate-500">
            النتائج: <strong className="text-amber-400">{filteredCount}</strong> من {totalToolsCount}
          </span>
        </div>
      </div>
    </section>
  );
};
