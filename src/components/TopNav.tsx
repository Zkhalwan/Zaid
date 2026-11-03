import React from 'react';
import { Film, Sparkles, Wand2, Music, Download, Play, Square, RefreshCw } from 'lucide-react';

interface TopNavProps {
  onOpenAiDirector: () => void;
  onOpenAiMotion: () => void;
  onOpenAudioSettings: () => void;
  onStartExport: () => void;
  onResetProject: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  slideCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenAiDirector,
  onOpenAiMotion,
  onOpenAudioSettings,
  onStartExport,
  onResetProject,
  isPlaying,
  onTogglePlay,
  slideCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single Brand element */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            PicToMotion
          </span>
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap -mt-0.5">
            استوديو تحويل الصور إلى فيديو
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links / Studio Tools */}
      <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-300">
        <button
          onClick={onOpenAiDirector}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>المخرج الذكي AI</span>
        </button>

        <button
          onClick={onOpenAiMotion}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-colors whitespace-nowrap shrink-0"
        >
          <Wand2 className="w-4 h-4 text-indigo-400" />
          <span>تحريك الصور AI</span>
        </button>

        <button
          onClick={onOpenAudioSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Music className="w-4 h-4 text-emerald-400" />
          <span>الموسيقى والصوتيات</span>
        </button>

        <button
          onClick={onResetProject}
          title="إعادة تعيين القوالب الافتراضية"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة ضبط</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action (Export Video) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onTogglePlay}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors whitespace-nowrap"
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>إيقاف</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>تشغيل</span>
            </>
          )}
        </button>

        <button
          onClick={onStartExport}
          disabled={slideCount === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>تصدير الفيديو HD</span>
        </button>
      </div>
    </header>
  );
};
