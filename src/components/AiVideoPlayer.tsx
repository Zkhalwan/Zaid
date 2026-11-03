import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Sparkles, 
  Bot, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  MessageSquare,
  CheckCircle2,
  Send,
  HelpCircle
} from 'lucide-react';
import { AiTool } from '../data/toolsData';

interface AiVideoPlayerProps {
  tool: AiTool;
  onOpenOfficialUrl: () => void;
}

export interface VideoScene {
  id: number;
  title: string;
  tagline: string;
  narration: string;
  durationSec: number;
  type: 'intro' | 'features' | 'prompt_demo' | 'steps' | 'pricing';
}

export const AiVideoPlayer: React.FC<AiVideoPlayerProps> = ({
  tool,
  onOpenOfficialUrl,
}) => {
  // Generate structured scenes for this tool
  const scenes: VideoScene[] = useMemo(() => {
    return [
      {
        id: 0,
        title: `مقدمة وتعريف بـ ${tool.name}`,
        tagline: tool.tagline,
        narration: `أهلاً بكم في هذا الشرح المصمم بالذكاء الاصطناعي. نتعرف اليوم على أداة ${tool.name} المطورة من قبل شركة ${tool.developer}. تعد هذه الأداة من أقوى منصات الذكاء الاصطناعي المتخصصة في ${tool.category === 'text' ? 'توليد النصوص والتحليل' : tool.category === 'image' ? 'تصميم وتوليد الصور' : tool.category === 'video' ? 'صناعة وتحريك الفيديو' : tool.category === 'coding' ? 'البرمجة وهندسة الأكواد' : tool.category === 'audio' ? 'الصوتيات والموسيقى' : 'البحث والإنتاجية'}. ${tool.tagline}.`,
        durationSec: 14,
        type: 'intro',
      },
      {
        id: 1,
        title: 'أبرز المميزات والقدرات الفائقة',
        tagline: `ما الذي يجعل ${tool.name} استثنائية؟`,
        narration: `تتميز أداة ${tool.name} بعدة ميزات رائدة، من أهمها: ${tool.keyFeatures.slice(0, 3).join('، إضافة إلى ')}. تم تصميمها لتوفر أعلى دقة وسرعة في إنجاز المهام اليومية والاحترافية.`,
        durationSec: 14,
        type: 'features',
      },
      {
        id: 2,
        title: 'تجربة برومبت ومحاكاة عملية',
        tagline: tool.samplePrompts[0]?.title || 'تطبيق عملي مباشر بالأوامر',
        narration: `نشاهد الآن تجربة عملية؛ بمجرد كتابة أمر برومبت دقيق مثل: "${tool.samplePrompts[0]?.prompt.slice(0, 80)}..."، تقوم الأداة بمعالجة السياق فوراً وتوليد مخرجات عالية الاحترافية كما يظهر أمامكم على شاشة العرض.`,
        durationSec: 16,
        type: 'prompt_demo',
      },
      {
        id: 3,
        title: 'خطوات البدء السريعة',
        tagline: 'كيف تبدأ استخدام الأداة خلال دقيقتين؟',
        narration: `للبدء، الأمر في غاية البساطة: أولاً التوجه إلى الموقع الرسمي ${tool.officialUrl}، ثانياً إنشاء حساب وتسجيل الدخول، ثم البدء فوراً في إدخال بياناتك أو ملفاتك والاستفادة من الذكاء الاصطناعي.`,
        durationSec: 14,
        type: 'steps',
      },
      {
        id: 4,
        title: 'الأسعار والتقييم النهائي',
        tagline: `${tool.pricing} · تقييم ${tool.rating} من 5`,
        narration: `توفر الأداة ${tool.pricingDetails}. تعتبر خياراً ممتازاً وموصى به بتقييم ${tool.rating} من 5. ننصحكم ببدء تجربتها الآن عبر الرابط المباشر.`,
        durationSec: 12,
        type: 'pricing',
      },
    ];
  }, [tool]);

  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Interactive AI Ask Q&A
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const currentScene = scenes[currentSceneIdx] || scenes[0];
  const timerRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Speech Narration handler
  const speakNarration = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.05 * playbackSpeed;
      utterance.pitch = 1.0;

      // Select Arabic voice if available
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('Arab'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not available:', e);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeaking();
    } else {
      setIsPlaying(true);
      speakNarration(currentScene.narration);
    }
  };

  // Scene transition logic
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    speakNarration(currentScene.narration);

    const intervalMs = 100;
    const totalDurationMs = (currentScene.durationSec * 1000) / playbackSpeed;
    const stepIncrement = (intervalMs / totalDurationMs) * 100;

    timerRef.current = window.setInterval(() => {
      setSceneProgress((prev) => {
        if (prev >= 100) {
          // Go to next scene
          if (currentSceneIdx < scenes.length - 1) {
            setCurrentSceneIdx((curr) => curr + 1);
            return 0;
          } else {
            // End of video presentation
            setIsPlaying(false);
            stopSpeaking();
            return 100;
          }
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSceneIdx, playbackSpeed, isMuted]);

  // Restart video
  const handleRestart = () => {
    stopSpeaking();
    setCurrentSceneIdx(0);
    setSceneProgress(0);
    setIsPlaying(true);
  };

  // Jump to specific scene
  const handleSelectScene = (idx: number) => {
    stopSpeaking();
    setCurrentSceneIdx(idx);
    setSceneProgress(0);
    if (isPlaying) {
      speakNarration(scenes[idx].narration);
    }
  };

  // Interactive Ask AI about this tool
  const handleAskPresenter = async (customQ?: string) => {
    const q = customQ || userQuestion;
    if (!q || q.trim().length === 0) return;

    try {
      setIsAskingAi(true);
      setAiAnswer(null);

      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `سؤال محدد عن أداة ${tool.name}: ${q}. أجب باختصار في نقطتين مباشرتين.`,
          currentCategory: tool.category,
        }),
      });

      const data = await res.json();
      if (data && data.summary) {
        setAiAnswer(data.summary);
        if (!isMuted) {
          speakNarration(data.summary);
        }
      }
    } catch (err) {
      console.error(err);
      setAiAnswer(`أداة ${tool.name} ممتازة جداً وتدعم هذه الميزة بكفاءة عالية وفق آخر تحديثات 2026.`);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
      {/* 1. Top Scene Status Bar */}
      <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-white">فيديو شرح مصمم بالذكاء الاصطناعي</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400 font-mono text-[11px]">
            المشهد {currentSceneIdx + 1} من {scenes.length}: {currentScene.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-slate-400 text-[11px]">أفاتار الذكاء الاصطناعي الناطق</span>
        </div>
      </div>

      {/* 2. Interactive Video Presentation Stage */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex flex-col justify-between p-6 sm:p-8 select-none">
        {/* Subtle grid and ambient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Floating AI Virtual Presenter Avatar Box */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3 p-2 pr-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-amber-400/40 shrink-0">
            <img
              src="/src/assets/images/ai_presenter_avatar_1793632087065.jpg"
              alt="المحاضر الافتراضي بالذكاء الاصطناعي"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 border-2 border-amber-400 rounded-xl animate-pulse pointer-events-none" />
            )}
          </div>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">سارة · محاضر AI</span>
              {isPlaying && (
                <div className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
            <span className="text-[10px] text-amber-400 font-mono">
              {isPlaying ? 'يشرح الآن...' : 'جاهز للشرح'}
            </span>
          </div>
        </div>

        {/* Main Slide Content Animation Stage */}
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-2xl mx-auto z-10 w-full pt-8 sm:pt-4">
          {/* Scene 1: Intro */}
          {currentScene.type === 'intro' && (
            <div className="flex flex-col items-center gap-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-xl shadow-amber-500/10">
                {tool.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {tool.name}
                </h3>
                <span className="text-sm sm:text-base text-amber-400 font-semibold mt-1 block">
                  {tool.arabicName} · تطوير {tool.developer}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {tool.tagline}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                  {tool.pricing}
                </span>
                <span>·</span>
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-amber-300">
                  ★ {tool.rating} تقييم المستخدمين
                </span>
              </div>
            </div>
          )}

          {/* Scene 2: Key Features Grid */}
          {currentScene.type === 'features' && (
            <div className="w-full flex flex-col items-center gap-4 animate-fadeIn">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                القدرات والمميزات الأساسية
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                ما الذي يميز {tool.name}؟
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-right mt-1">
                {tool.keyFeatures.slice(0, 4).map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scene 3: Live Prompt Simulator */}
          {currentScene.type === 'prompt_demo' && (
            <div className="w-full flex flex-col items-center gap-3 animate-fadeIn">
              <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>محاكاة عملية: كتابة برومبت وتوليد النتيجة</span>
              </div>
              
              {/* Mock Software Screen */}
              <div className="w-full rounded-2xl bg-slate-900/90 border border-slate-700/80 p-4 text-right shadow-2xl">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <span className="font-mono text-amber-400">Prompt Console v2.6</span>
                  <span className="text-slate-500">منصة {tool.name}</span>
                </div>
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed mb-3">
                  <span className="text-slate-500 select-none mr-2">&gt;</span>
                  {tool.samplePrompts[0]?.prompt || 'Generate a high quality output...'}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>تمت المعالجة وتوليد النتيجة بنجاح فائقة الدقة</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">0.8 ثانية</span>
                </div>
              </div>
            </div>
          )}

          {/* Scene 4: Step-by-Step Quickstart */}
          {currentScene.type === 'steps' && (
            <div className="w-full flex flex-col items-center gap-4 animate-fadeIn">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                دليل البدء السريع
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                3 خطوات بسيطة للانطلاق
              </h3>
              <div className="flex flex-col gap-2 w-full text-right mt-1">
                {tool.stepByStep.slice(0, 3).map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-xs text-slate-200"
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scene 5: Pricing & Verdict */}
          {currentScene.type === 'pricing' && (
            <div className="flex flex-col items-center gap-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xl">
                ★
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  خطة الأسعار والتقييم النهائي
                </h3>
                <span className="text-xs text-slate-400 mt-1 block">
                  {tool.pricingDetails}
                </span>
              </div>
              <button
                onClick={onOpenOfficialUrl}
                className="mt-2 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xl shadow-amber-500/20 transition-all"
              >
                <span>تجربة {tool.name} عبر الرابط الرسمي</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Real-time Subtitles Ticker */}
        <div className="w-full max-w-3xl mx-auto z-10 pt-2">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md text-center text-xs text-slate-200 leading-relaxed shadow-lg">
            <span className="text-amber-400 font-semibold ml-1.5">[التعليق الصوتي AI]:</span>
            <span>{currentScene.narration}</span>
          </div>
        </div>

        {/* Big Center Play Overlay Button when paused */}
        {!isPlaying && (
          <button
            onClick={handleTogglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-amber-400 transition-all z-20"
            title="بدء تشغيل فيديو الشرح بالذكاء الاصطناعي"
          >
            <Play className="w-7 h-7 translate-x-0.5 fill-current" />
          </button>
        )}
      </div>

      {/* 3. Scrubbable Timeline Track */}
      <div className="px-5 pt-3 pb-2 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-1.5 mb-2">
          {scenes.map((scene, idx) => {
            const isCurrent = idx === currentSceneIdx;
            const isPassed = idx < currentSceneIdx;
            return (
              <button
                key={scene.id}
                onClick={() => handleSelectScene(idx)}
                className={`flex-1 h-1.5 rounded-full overflow-hidden transition-all ${
                  isCurrent
                    ? 'bg-amber-500/40 ring-1 ring-amber-400'
                    : isPassed
                    ? 'bg-amber-500'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={`الانتقال لمشهد: ${scene.title}`}
              >
                {isCurrent && (
                  <div
                    className="h-full bg-amber-400 transition-all duration-100"
                    style={{ width: `${sceneProgress}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Video Player Controls Bar */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="إعادة من البداية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSelectScene(Math.max(0, currentSceneIdx - 1))}
              disabled={currentSceneIdx === 0}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
              title="المشهد السابق"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSelectScene(Math.min(scenes.length - 1, currentSceneIdx + 1))}
              disabled={currentSceneIdx === scenes.length - 1}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
              title="المشهد التالي"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <span className="font-mono text-slate-400 text-[11px] px-2 tabular-nums">
              المشهد {currentSceneIdx + 1} / {scenes.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed toggle */}
            <button
              onClick={() => {
                const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
                setPlaybackSpeed(nextSpeed);
              }}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 font-mono text-[11px] text-amber-300"
              title="سرعة الإلقاء"
            >
              {playbackSpeed}x
            </button>

            {/* Mute toggle */}
            <button
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute) stopSpeaking();
                else if (isPlaying) speakNarration(currentScene.narration);
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Interactive "Ask the AI Presenter" Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-amber-400" />
            <span>اسأل المحاضر الافتراضي عن أداة {tool.name}:</span>
          </span>
          <span className="text-[11px] text-slate-500">إجابة فورية ذكية</span>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskPresenter();
            }}
            placeholder={`مثال: هل تدعم ${tool.name} اللغة العربية؟ كيف أستخدمها مجاناً؟`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pr-4 pl-12 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={() => handleAskPresenter()}
            disabled={isAskingAi || !userQuestion.trim()}
            className="absolute left-2 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Suggested questions */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 scrollbar-thin">
          <span className="shrink-0 text-slate-500">اقتراحات:</span>
          <button
            onClick={() => {
              const q = `هل تدعم أداة ${tool.name} اللغة العربية؟`;
              setUserQuestion(q);
              handleAskPresenter(q);
            }}
            className="hover:text-amber-300 bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 rounded-lg shrink-0 transition-colors"
          >
            هل تدعم العربية؟
          </button>
          <button
            onClick={() => {
              const q = `كيف أستخدم ${tool.name} مجاناً؟`;
              setUserQuestion(q);
              handleAskPresenter(q);
            }}
            className="hover:text-amber-300 bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 rounded-lg shrink-0 transition-colors"
          >
            كيف أستخدمها مجاناً؟
          </button>
          <button
            onClick={() => {
              const q = `ما هي أهم البدائل المشابهة لـ ${tool.name}؟`;
              setUserQuestion(q);
              handleAskPresenter(q);
            }}
            className="hover:text-amber-300 bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 rounded-lg shrink-0 transition-colors"
          >
            أهم البدائل
          </button>
        </div>

        {/* Answer display */}
        {aiAnswer && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-200 animate-fadeIn mt-1">
            <span className="font-bold text-amber-300 block mb-0.5">إجابة المحاضر:</span>
            <p className="leading-relaxed">{aiAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
