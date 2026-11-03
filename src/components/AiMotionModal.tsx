import React, { useState } from 'react';
import { Wand2, X, Play, Download, Sparkles, Loader2, Plus, Film, AlertCircle } from 'lucide-react';
import { SlideItem } from '../types';

interface AiMotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideItem[];
  onAddGeneratedVideoSlide?: (videoUrl: string, name: string) => void;
}

export const AiMotionModal: React.FC<AiMotionModalProps> = ({
  isOpen,
  onClose,
  slides,
  onAddGeneratedVideoSlide,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(slides[0]?.imageUrl || '');
  const [prompt, setPrompt] = useState('حركة كاميرا سينمائية بطيئة مع ضباب شروق شمس متصاعد وأشعة ضوء متلألئة');
  const [duration, setDuration] = useState<'5s' | '10s'>('5s');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    'حركة كاميرا سينمائية بطيئة مع ضباب شروق شمس متصاعد',
    'أضواء نيون متوهجة وانعكاسات مائية متحركة على الأرض',
    'دوران كاميرا ثلاثي الأبعاد 3D Camera Orbit مع عمق بصري',
    'نسيم عليل يحرك الأشجار وسحاب عابر في الأفق',
  ];

  const handleAnimate = async () => {
    if (!selectedImage) return;

    try {
      setIsGenerating(true);
      setErrorMsg(null);
      setGeneratedVideoUrl(null);

      const res = await fetch('/api/ai/animate-omni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: selectedImage,
          motionPrompt: prompt,
          duration,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to animate video');
      }

      if (data.videoBase64) {
        const videoUrl = `data:${data.mimeType || 'video/mp4'};base64,${data.videoBase64}`;
        setGeneratedVideoUrl(videoUrl);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'تعذر توليد الفيديو بواسطة النموذج. يمكنك استخدام محرك الحركة الحركية المباشر.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">تحريك الصور بالذكاء الاصطناعي (AI Motion)</h2>
              <p className="text-xs text-slate-400">
                بث الحياة في الصورة الثابتة وتحويلها إلى مشهد فيديو واقعي مع مؤثرات كاميرا
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-5 scrollbar-thin">
          {/* Select source image */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اختر الصورة المراد تحريكها:
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {slides.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedImage(s.imageUrl)}
                  className={`relative w-28 h-20 rounded-xl overflow-hidden cursor-pointer border-2 shrink-0 transition-all ${
                    selectedImage === s.imageUrl
                      ? 'border-indigo-400 ring-2 ring-indigo-400/30 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={s.imageUrl}
                    alt={s.title || `مشهد ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 px-1 rounded text-white">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Prompts */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نماذج حركات جاهزة:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg border text-right transition-colors ${
                    prompt === p
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-medium'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              وصف الحركة المطلوب (Motion Prompt):
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Settings: Duration and Aspect Ratio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                مدة الفيديو:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDuration('5s')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-mono ${
                    duration === '5s'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  5 ثواني
                </button>
                <button
                  onClick={() => setDuration('10s')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-mono ${
                    duration === '10s'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  10 ثواني
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الأبعاد:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border ${
                    aspectRatio === '16:9'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  16:9 عريض
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex-1 py-1.5 text-xs rounded-lg border ${
                    aspectRatio === '9:16'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  9:16 طولي
                </button>
              </div>
            </div>
          </div>

          {/* Generated result preview */}
          {generatedVideoUrl && (
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
              <span className="text-xs font-bold text-indigo-300">الفيديو المتحرك الناتج:</span>
              <video
                src={generatedVideoUrl}
                controls
                autoPlay
                loop
                className="w-full max-h-64 rounded-xl object-contain bg-black"
              />
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={generatedVideoUrl}
                  download="picmotion-ai-video.mp4"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الفيديو MP4</span>
                </a>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-0.5">ملاحظة حول توليد الفيديو المباشر</p>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  يتطلب توليد الفيديو المتقدم بالذكاء الاصطناعي مفتاح Gemini المدفوع. يمكنك الاستفادة الكاملة من محرك الاستوديو (تأثيرات كين بيرنز، الانتقالات، والموسيقى) لتصدير فيديو عالي الدقة مجاناً وفوراً!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            إغلاق
          </button>

          <button
            onClick={handleAnimate}
            disabled={isGenerating || !selectedImage}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 hover:brightness-105 disabled:opacity-50 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري معالجة وتحريك المشهد...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>بدء التحريك بالذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
