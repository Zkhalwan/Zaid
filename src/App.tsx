import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { ToolCard } from './components/ToolCard';
import { ToolDetailModal } from './components/ToolDetailModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { PromptsLibraryModal } from './components/PromptsLibraryModal';
import { GooglePlayModal } from './components/GooglePlayModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { DocumentStudioModal } from './components/DocumentStudioModal';
import { AI_TOOLS, AiTool, ToolCategory } from './data/toolsData';
import { useFirebase } from './context/FirebaseContext';
import { Sparkles, Video, Play, ExternalLink, HelpCircle, Compass, Heart, Cloud, HardDrive, Download, Folder, History, RotateCcw, FileText } from 'lucide-react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Firebase context
  const { user, favorites, signIn } = useFirebase();

  // Modals
  const [selectedToolForDetail, setSelectedToolForDetail] = useState<AiTool | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isGooglePlayOpen, setIsGooglePlayOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [isDocumentStudioOpen, setIsDocumentStudioOpen] = useState(false);
  const [promptFilterTool, setPromptFilterTool] = useState<string | null>(null);

  // Filter tools based on search, category, pricing, and favorites
  const filteredTools = useMemo(() => {
    return AI_TOOLS.filter((tool) => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      const matchesPricing = selectedPricing === 'all' || tool.pricing === selectedPricing;
      const matchesFavorites = !showFavoritesOnly || favorites.includes(tool.id);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.arabicName.toLowerCase().includes(q) ||
        tool.developer.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keyFeatures.some((f) => f.toLowerCase().includes(q)) ||
        tool.useCases.some((u) => u.toLowerCase().includes(q));

      return matchesCategory && matchesPricing && matchesFavorites && matchesSearch;
    });
  }, [searchQuery, activeCategory, selectedPricing, showFavoritesOnly, favorites]);

  // Handle opening prompts for specific tool
  const handleOpenPromptsForTool = (tool: AiTool) => {
    setPromptFilterTool(tool.name);
    setIsPromptsOpen(true);
  };

  // Handle selecting a tool by name (e.g. from AI advisor)
  const handleSelectToolByName = (name: string) => {
    const found = AI_TOOLS.find(
      (t) => t.name.toLowerCase() === name.toLowerCase() || t.arabicName.includes(name)
    );
    if (found) {
      setSelectedToolForDetail(found);
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleFavoritesFilter = () => {
    if (!user) {
      signIn();
      return;
    }
    setShowFavoritesOnly((prev) => !prev);
    handleScrollToSection('catalog');
  };

  // Top featured spotlight videos
  const spotlightTools = useMemo(() => {
    return [
      AI_TOOLS.find((t) => t.id === 'chatgpt')!,
      AI_TOOLS.find((t) => t.id === 'runway')!,
      AI_TOOLS.find((t) => t.id === 'midjourney')!,
      AI_TOOLS.find((t) => t.id === 'cursor')!,
    ].filter(Boolean);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Header Navigation */}
      <Header
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        onOpenPrompts={() => {
          setPromptFilterTool('all');
          setIsPromptsOpen(true);
        }}
        onOpenGooglePlay={() => setIsGooglePlayOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenDocumentStudio={() => setIsDocumentStudioOpen(true)}
        onScrollToSection={handleScrollToSection}
        onToggleFavoritesFilter={handleToggleFavoritesFilter}
        isShowingFavoritesOnly={showFavoritesOnly}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 pb-16">
        {/* 2. Hero Search & Filter Section */}
        <HeroSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          selectedPricing={selectedPricing}
          onPricingChange={setSelectedPricing}
          totalToolsCount={AI_TOOLS.length}
          filteredCount={filteredTools.length}
          onOpenAdvisor={() => setIsAdvisorOpen(true)}
        />

        {/* 3. Featured Video Spotlight Section */}
        <section id="featured-videos" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg md:text-xl font-bold text-white">
                شروحات فيديو تفاعلية مصممة بالذكاء الاصطناعي
              </h2>
            </div>
            <span className="text-xs text-amber-300 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>محاضر افتراضي AI ناطق بالعربية</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {spotlightTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setSelectedToolForDetail(tool)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-all shadow-md hover:shadow-xl"
              >
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${tool.videoUrl.split('embed/')[1]}/hqdefault.jpg`}
                    alt={tool.videoTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  
                  <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  </div>

                  <span className="absolute bottom-2 left-2 bg-slate-950/80 text-[10px] font-mono px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                    <span>فيديو AI تفاعلي</span>
                  </span>
                </div>

                <div className="p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      {tool.name}
                    </span>
                    <span className="text-[11px] text-slate-400">{tool.developer}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {tool.videoTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Complete Tools Catalog Grid */}
        <section id="catalog" className="w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>دليل وشروحات الأدوات</span>
                <span className="text-sm font-mono text-amber-400">({filteredTools.length})</span>
              </h2>
              {showFavoritesOnly && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>تصفية حسب المفضلة</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              {showFavoritesOnly ? (
                <button
                  onClick={() => setShowFavoritesOnly(false)}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  عرض جميع الأدوات
                </button>
              ) : (
                <span className="text-slate-400">
                  انقر على أي أداة لمشاهدة فيديو الشرح وقراءة الدليل وكتابة تقييمك
                </span>
              )}
            </div>
          </div>

          {filteredTools.length === 0 ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
              {showFavoritesOnly ? (
                <>
                  <Heart className="w-12 h-12 text-rose-500/50 mb-1" />
                  <h3 className="text-base font-bold text-white">قائمة مفضلتك فارغة</h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    انقر على أيقونة القلب على أي بطاقة أداة لحفظها في مفضلتك ومزامنتها عبر حساب Firebase السحابي.
                  </p>
                  <button
                    onClick={() => setShowFavoritesOnly(false)}
                    className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    استعراض جميع الأدوات
                  </button>
                </>
              ) : (
                <>
                  <HelpCircle className="w-10 h-10 text-slate-600" />
                  <h3 className="text-base font-bold text-white">لم نجد أدوات تطابق بحثك</h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    جرب تغيير كلمات البحث أو اختيار تصنيف "جميع الأدوات" لاستعراض كافة المنصات المتاحة.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                      setSelectedPricing('all');
                      setShowFavoritesOnly(false);
                    }}
                    className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    إعادة ضبط جميع الفلاتر
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelect={(t) => setSelectedToolForDetail(t)}
                  onOpenPromptsForTool={handleOpenPromptsForTool}
                />
              ))}
            </div>
          )}
        </section>

        {/* 5. Version History & Document Studio Spotlight Banner */}
        <section className="w-full p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg font-bold">
              <History className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  سجل الإصدارات والتراجع التلقائي (Version History)
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                  AI Logs & Diff Comparison
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                تتبع كل كلمة كتبتها أو اقترحها الذكاء الاصطناعي مع إمكانية التراجع الفوري
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                استعرض شجرة التعديلات الزمنية الكاملة لمستنداتك ومذكراتك، قارن الفروقات كلمة بكلمة بين أي نسختين، واستعد أي إصدار سابق بضغطة زر دون خوف من فقدان أي فكرة أو تعديل.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDocumentStudioOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>فتح محرر المستندات وسجل الإصدارات</span>
            </button>
          </div>
        </section>

        {/* 6. Google Drive Cloud Workspace Feature Card */}
        <section className="w-full p-6 md:p-8 rounded-3xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-lg">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  ميزة Google Drive السحابية
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                  Google Workspace
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                احفظ وصدّر بنك أوامر الذكاء الاصطناعي إلى Google Drive
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                أنشئ مجلداً مخصصاً لـ AI Tools Atlas على حسابك السحابي، صدّر قوالب الأوامر بنقرة واحدة، وتصفح مستندات وملاحظات مشاريعك مباشرة من داخل التطبيق.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGoogleDriveOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all shrink-0"
          >
            <HardDrive className="w-4 h-4" />
            <span>فتح مساحة Google Drive</span>
          </button>
        </section>

        {/* 7. Tool Decision Matrix & Comparison Guide */}
        <section className="w-full p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-2 text-amber-400">
            <Compass className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">
              دليل اتخاذ القرار السريع: كيف تختار الأداة المناسبة لهدفك؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col gap-2">
              <h3 className="font-bold text-white text-sm text-amber-300">
                إذا كنت تريد: كتابة محتوى وأبحاث
              </h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                استخدم <strong className="text-white">ChatGPT</strong> للمحادثة العامة والمهام اليومية، أو <strong className="text-white">Claude 3.5</strong> للمقالات الأدبية العميقة والمنطق، واستخدم <strong className="text-white">Perplexity</strong> للبحث الموثق بروابط حية.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col gap-2">
              <h3 className="font-bold text-white text-sm text-indigo-300">
                إذا كنت تريد: صور وتصميمات وفيديوهات
              </h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                استخدم <strong className="text-white">Midjourney</strong> للواقعية الفنية الفائقة، و <strong className="text-white">DALL-E 3</strong> للنصوص الدقيقة داخل الصور، و <strong className="text-white">Runway Gen-3</strong> لمقاطع الفيديو السينمائية المتحركة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col gap-2">
              <h3 className="font-bold text-white text-sm text-emerald-300">
                إذا كنت تريد: برمجة وهندسة صوت
              </h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                استخدم <strong className="text-white">Cursor AI</strong> لبناء مشاريعك البرمجية كاملة، واستخدم <strong className="text-white">ElevenLabs</strong> لأقوى تعليق صوتي واستنساخ، و <strong className="text-white">Suno</strong> لتأليف الموسيقى.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Editorial Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-900/60 py-8 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">موسوعة أدوات الذكاء الاصطناعي</span>
            <span className="text-slate-600">·</span>
            <span>دليل تعليمي شامل مع فيديوهات شرح وتطبيقات عملية</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <History className="w-3.5 h-3.5" />
              <span>Version History Logged</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-sky-400 font-medium">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Google Drive API v3</span>
            </span>
            <span>·</span>
            <span>تحديثات 2026</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ToolDetailModal
        tool={selectedToolForDetail}
        onClose={() => setSelectedToolForDetail(null)}
      />

      <AiAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        onSelectToolByName={handleSelectToolByName}
      />

      <PromptsLibraryModal
        isOpen={isPromptsOpen}
        onClose={() => setIsPromptsOpen(false)}
        initialToolFilter={promptFilterTool}
      />

      <GooglePlayModal
        isOpen={isGooglePlayOpen}
        onClose={() => setIsGooglePlayOpen(false)}
        appUrl={typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-kujaoyhbrtryxhph4cyeun-976790839286.europe-west2.run.app'}
      />

      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        onOpenDocumentStudio={() => setIsDocumentStudioOpen(true)}
      />

      <DocumentStudioModal
        isOpen={isDocumentStudioOpen}
        onClose={() => setIsDocumentStudioOpen(false)}
      />
    </div>
  );
}
