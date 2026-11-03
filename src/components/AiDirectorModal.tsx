import React, { useState } from 'react';
import { Sparkles, Film, Wand2, X, Check, Loader2, Music, Compass } from 'lucide-react';
import { SlideItem, ProjectSettings } from '../types';

interface AiDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  onApplyStoryboard: (updatedSlides: SlideItem[], projectUpdates: Partial<ProjectSettings>) => void;
}

export const AiDirectorModal: React.FC<AiDirectorModalProps> = ({
  isOpen,
  onClose,
  slides,
  onApplyStoryboard,
}) => {
  const [theme, setTheme] = useState('cinematic');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storyboardResult, setStoryboardResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const themes = [
    { id: 'cinematic', label: 'سينمائي ملحمي', desc: 'أجواء درامية ساحرة مع حركات كاميرا عميقة' },
    { id: 'poetic', label: 'شاعري وهادئ', desc: 'تعليقات رقيقة وتلاشيات ناعمة تنسجم مع الطبيعة' },
    { id: 'documentary', label: 'وثائقي استكشافي', desc: 'سرد معرفي وتصوير واسع بأسلوب ناشيونال جيوغرافيك' },
    { id: 'commercial', label: 'عصري وسريع', desc: 'إيقاع مشوق ومؤثرات بصرية حيوية ملائمة للسوشيال ميديا' },
  ];

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        images: slides.map((s, idx) => ({
          name: s.name || s.title || `Image ${idx + 1}`,
          caption: s.subtitle || s.title || '',
          data: s.imageUrl,
        })),
        userTheme: `${theme} - ${customInstructions}`,
        language,
      };

      const res = await fetch('/api/ai/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate storyboard');
      }

      setStoryboardResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'حدث خطأ أثناء الاتصال بالمخرج الذكي');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!storyboardResult) return;

    const scenes = storyboardResult.scenes || [];
    const updatedSlides = slides.map((slide, idx) => {
      const match = scenes.find((s: any) => s.slideIndex === idx + 1) || scenes[idx];
      if (match) {
        return {
          ...slide,
          title: match.title || slide.title,
          subtitle: match.narration || slide.subtitle,
          motion: (match.cameraMotion as any) || slide.motion,
          transition: (match.transition as any) || slide.transition,
          duration: match.durationSec || slide.duration,
          filter: (match.colorFilter as any) || slide.filter,
        };
      }
      return slide;
    });

    onApplyStoryboard(updatedSlides, {
      title: storyboardResult.title || undefined,
      soundtrack: (storyboardResult.recommendedMood as any) || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">المخرج الذكي (AI Director)</h2>
              <p className="text-xs text-slate-400">
                تحليل تسلسل الصور وتوليد قصة سينمائية، حركات كاميرا، وانتقالات متناسقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-5 scrollbar-thin">
          {!storyboardResult ? (
            <>
              {/* Theme choices */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  اختر الطابع الإخراجي للفيديو:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-xl border text-right transition-colors ${
                        theme === t.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold text-xs text-amber-300">{t.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  لغة السرد والتعليق:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLanguage('ar')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium border ${
                      language === 'ar'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    العربية الفصحى
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium border ${
                      language === 'en'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Optional Custom direction */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  توجيهات إضافية للمخرج الذكي (اختياري):
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="مثال: ركز على مشاعر السفر والشغف بالاكتشاف..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}
            </>
          ) : (
            /* Storyboard Preview Result */
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block mb-1">
                  العنوان المقترح للفيديو
                </span>
                <h3 className="text-base font-bold text-white">{storyboardResult.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{storyboardResult.subtitle}</p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-amber-300">
                  <Music className="w-3.5 h-3.5" />
                  <span>الموسيقى المقترحة: {storyboardResult.recommendedMood}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-300 block">
                  خطة المشاهد المقترحة ({storyboardResult.scenes?.length || 0} مشاهد):
                </span>
                {storyboardResult.scenes?.map((scene: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-amber-300">مشهد #{i + 1}: {scene.title}</span>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="flex items-center gap-1 text-indigo-300">
                          <Compass className="w-3 h-3" />
                          {scene.cameraMotion}
                        </span>
                        <span>·</span>
                        <span>{scene.durationSec}s</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                      "{scene.narration}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            إلغاء
          </button>

          {!storyboardResult ? (
            <button
              onClick={handleGenerate}
              disabled={isLoading || slides.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحليل وصياغة الإخراج...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>توليد الإخراج السينمائي الآن</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>تطبيق القصة والمؤثرات على الفيديو</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
