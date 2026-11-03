import React, { useState } from 'react';
import { 
  Sliders, 
  Compass, 
  MoveHorizontal, 
  Clock, 
  Palette, 
  Type, 
  Mic, 
  Volume2, 
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import { SlideItem, CameraMotion, TransitionType, ColorFilter, TextPosition, TextAnimation } from '../types';

interface SlideInspectorProps {
  slide: SlideItem | null;
  onUpdateSlide: (updated: Partial<SlideItem>) => void;
}

export const SlideInspector: React.FC<SlideInspectorProps> = ({
  slide,
  onUpdateSlide,
}) => {
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [ttsSuccess, setTtsSuccess] = useState(false);

  if (!slide) {
    return (
      <div className="w-80 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-500 min-h-[460px]">
        <Sliders className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-400">حدد مشهداً من المخطط الزمني</p>
        <p className="text-xs text-slate-500 mt-1">لتخصيص حركة الكاميرا والانتقالات والنصوص والألوان</p>
      </div>
    );
  }

  // Camera motions list
  const motions: { id: CameraMotion; label: string; desc: string }[] = [
    { id: 'zoom_in', label: 'تكبير ناعم', desc: 'Zoom In سينمائي' },
    { id: 'zoom_out', label: 'تصغير كاشف', desc: 'Zoom Out للمشهد' },
    { id: 'pan_right', label: 'بان لليمين', desc: 'تحريك أفقي لليمين' },
    { id: 'pan_left', label: 'بان لليسار', desc: 'تحريك أفقي لليسار' },
    { id: 'tilt_up', label: 'إمالة للأعلى', desc: 'صعود عمودي Tilt' },
    { id: 'dynamic_drift', label: 'انجراف 3D', desc: 'حركة قطرية مع دوران' },
    { id: 'pulse', label: 'نبض لطيف', desc: 'خفقان حيوي هادئ' },
  ];

  // Transitions list
  const transitions: { id: TransitionType; label: string }[] = [
    { id: 'crossfade', label: 'تلاشي ناعم' },
    { id: 'slide_left', label: 'انزلاق يسار' },
    { id: 'slide_right', label: 'انزلاق يمين' },
    { id: 'zoom_through', label: 'اندفاع تكبير' },
    { id: 'wipe_left', label: 'مسح خطي' },
    { id: 'fade_black', label: 'تلاشي أسود' },
  ];

  // Filters list
  const filters: { id: ColorFilter; label: string }[] = [
    { id: 'none', label: 'طبيعي' },
    { id: 'cinematic_warm', label: 'سينمائي دافئ' },
    { id: 'golden_hour', label: 'ساعة ذهبية' },
    { id: 'noir_bw', label: 'أبيض وأسود' },
    { id: 'vintage_film', label: 'فيلم كلاسيكي' },
    { id: 'vibrant_pop', label: 'ألوان مشبعة' },
    { id: 'cyberpunk', label: 'سايبربانك' },
  ];

  // Handle AI TTS Voiceover Generation
  const handleGenerateVoiceover = async () => {
    const textToSpeak = slide.subtitle || slide.title;
    if (!textToSpeak) return;

    try {
      setIsGeneratingTts(true);
      setTtsSuccess(false);

      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          language: 'ar',
          voice: 'Kore',
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        onUpdateSlide({
          voiceoverAudioUrl: audioUrl,
          voiceoverText: textToSpeak,
        });
        setTtsSuccess(true);
        setTimeout(() => setTtsSuccess(false), 3000);

        // Preview audio immediately
        const snd = new Audio(audioUrl);
        snd.play().catch(console.error);
      }
    } catch (err) {
      console.error('Failed to generate TTS:', err);
    } finally {
      setIsGeneratingTts(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 text-xs text-slate-300 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">إعدادات المشهد المختار</span>
        </div>
        <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[11px]">
          {slide.duration} ثانية
        </span>
      </div>

      {/* 1. Camera Motion Selector */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 font-medium text-slate-200">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>حركة الكاميرا (Ken Burns Motion)</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {motions.map((m) => {
            const isActive = slide.motion === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onUpdateSlide({ motion: m.id })}
                className={`p-2 rounded-lg border text-right transition-colors ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px]">{m.label}</div>
                <div className="text-[9px] text-slate-500 truncate">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Duration Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 font-medium text-slate-200">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>مدة عرض المشهد</span>
          </label>
          <span className="font-mono text-slate-300">{slide.duration}s</span>
        </div>
        <input
          type="range"
          min="1"
          max="8"
          step="0.5"
          value={slide.duration}
          onChange={(e) => onUpdateSlide({ duration: parseFloat(e.target.value) })}
          className="w-full accent-amber-400 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>1s</span>
          <span>4s</span>
          <span>8s</span>
        </div>
      </div>

      {/* 3. Transition to Next Slide */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 font-medium text-slate-200">
          <MoveHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span>الانتقال للمشهد التالي</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {transitions.map((t) => {
            const isActive = slide.transition === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onUpdateSlide({ transition: t.id })}
                className={`px-2.5 py-1.5 rounded-lg border text-center transition-colors text-[11px] ${
                  isActive
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Color Grading Filters */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 font-medium text-slate-200">
          <Palette className="w-3.5 h-3.5 text-rose-400" />
          <span>الفلتر السينمائي</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const isActive = slide.filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onUpdateSlide({ filter: f.id })}
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  isActive
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Text & Subtitle Overlays */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
        <label className="flex items-center gap-1.5 font-medium text-slate-200">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span>النصوص والتعليق على الفيديو</span>
        </label>

        <div>
          <span className="text-[11px] text-slate-400 mb-1 block">عنوان المشهد:</span>
          <input
            type="text"
            value={slide.title}
            onChange={(e) => onUpdateSlide({ title: e.target.value })}
            placeholder="أدخل عنواناً للمشهد..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <span className="text-[11px] text-slate-400 mb-1 block">الوصف / التعليق الصوتي:</span>
          <textarea
            rows={2}
            value={slide.subtitle}
            onChange={(e) => onUpdateSlide({ subtitle: e.target.value })}
            placeholder="أدخل جملة سردية تظهر على الفيديو..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none text-[11px]"
          />
        </div>

        {/* Text Position & Animation */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-[10px] text-slate-500 mb-1 block">الموقع:</span>
            <select
              value={slide.textPosition}
              onChange={(e) => onUpdateSlide({ textPosition: e.target.value as TextPosition })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-slate-300"
            >
              <option value="bottom">أسفل الشاشة</option>
              <option value="center">وسط الشاشة</option>
              <option value="top">أعلى الشاشة</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 mb-1 block">حركة النص:</span>
            <select
              value={slide.textAnimation}
              onChange={(e) => onUpdateSlide({ textAnimation: e.target.value as TextAnimation })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-slate-300"
            >
              <option value="fade">تلاشي هادئ</option>
              <option value="slide_up">صعود تدريجي</option>
              <option value="typewriter">آلة كاتبة</option>
              <option value="none">بدون حركة</option>
            </select>
          </div>
        </div>

        {/* AI Voiceover TTS Trigger */}
        <div className="mt-1">
          <button
            onClick={handleGenerateVoiceover}
            disabled={isGeneratingTts || (!slide.subtitle && !slide.title)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/25 text-indigo-300 rounded-lg transition-colors disabled:opacity-50"
          >
            {isGeneratingTts ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري توليد الصوت...</span>
              </>
            ) : ttsSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم تجهيز التعليق الصوتي!</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                <span>توليد تعليق صوتي ذكي (AI Voice)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
