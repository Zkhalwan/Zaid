import React, { useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  MoveHorizontal,
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';
import { SlideItem } from '../types';
import { getTotalDuration, computeSlideTimeline } from '../utils/videoRenderer';

interface TimelineProps {
  slides: SlideItem[];
  selectedSlideId: string | null;
  currentTime: number;
  onSelectSlide: (id: string) => void;
  onSeekTime: (time: number) => void;
  onAddSlideImages: (files: FileList | File[]) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onMoveSlide: (fromIndex: number, toIndex: number) => void;
  onOpenPresets: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  slides,
  selectedSlideId,
  currentTime,
  onSelectSlide,
  onSeekTime,
  onAddSlideImages,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onOpenPresets,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const totalDuration = getTotalDuration(slides);
  const timelineSegments = computeSlideTimeline(slides);

  // Handle clicking or dragging on the timeline track
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || totalDuration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeekTime(percent * totalDuration);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddSlideImages(e.target.files);
      e.target.value = '';
    }
  };

  // Playhead percentage position
  const playheadPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Timeline Header & Quick Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>مخطط المشاهد الزمني</span>
          </div>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono tabular-nums">
            {slides.length} {slides.length === 1 ? 'مشهد' : 'مشاهد'}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono tabular-nums">
            المدة الإجمالية: {totalDuration.toFixed(1)} ثانية
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة صور من جهازك</span>
          </button>

          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>نماذج وصور جاهزة</span>
          </button>
        </div>
      </div>

      {/* Scrubbable Timeline Track Ruler */}
      <div 
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative w-full h-7 bg-slate-950/80 rounded-lg border border-slate-800/80 cursor-pointer overflow-hidden mb-3 select-none"
      >
        {/* Seconds markers */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-slate-500 font-mono pointer-events-none">
          <span>0.0s</span>
          {totalDuration > 6 && <span>{(totalDuration * 0.25).toFixed(1)}s</span>}
          {totalDuration > 3 && <span>{(totalDuration * 0.5).toFixed(1)}s</span>}
          {totalDuration > 6 && <span>{(totalDuration * 0.75).toFixed(1)}s</span>}
          <span>{totalDuration.toFixed(1)}s</span>
        </div>

        {/* Slide partition blocks on ruler */}
        {timelineSegments.map((seg) => {
          const leftPct = (seg.startTime / totalDuration) * 100;
          const widthPct = ((seg.endTime - seg.startTime) / totalDuration) * 100;
          return (
            <div
              key={seg.slide.id}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              className={`absolute top-0 bottom-0 border-r border-slate-800/60 transition-colors ${
                selectedSlideId === seg.slide.id ? 'bg-amber-500/10' : ''
              }`}
            />
          );
        })}

        {/* Playhead needle */}
        <div 
          style={{ left: `${playheadPercent}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] z-10 pointer-events-none -translate-x-1/2"
        >
          <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -translate-x-[4px] -translate-y-1 rounded-xs" />
        </div>
      </div>

      {/* Slide Thumbnails Sequence Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {slides.map((slide, idx) => {
          const isSelected = selectedSlideId === slide.id;
          return (
            <div key={slide.id} className="flex items-center gap-2 shrink-0">
              {/* Slide Card */}
              <div
                onClick={() => onSelectSlide(slide.id)}
                className={`relative group w-44 rounded-xl overflow-hidden border transition-all cursor-pointer bg-slate-950 ${
                  isSelected 
                    ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10 scale-[1.02]' 
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="w-full h-24 overflow-hidden relative bg-slate-950">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title || `المشهد ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  
                  {/* Sequence number */}
                  <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-xs text-[11px] font-mono text-amber-300 px-1.5 py-0.5 rounded border border-slate-700/60">
                    #{idx + 1}
                  </span>

                  {/* Duration badge */}
                  <span className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span>{slide.duration}s</span>
                  </span>

                  {/* Motion indicator */}
                  <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] text-amber-300 bg-slate-900/80 px-1.5 py-0.5 rounded">
                    <Compass className="w-2.5 h-2.5" />
                    <span>{slide.motion.replace('_', ' ')}</span>
                  </span>
                </div>

                {/* Info & Micro Actions */}
                <div className="p-2 flex items-center justify-between text-xs">
                  <p className="truncate text-slate-200 text-[11px] font-medium max-w-[90px]">
                    {slide.title || `مشهد ${idx + 1}`}
                  </p>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {idx > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSlide(idx, idx - 1);
                        }}
                        className="p-1 hover:text-amber-400 text-slate-400 rounded"
                        title="تحريك لليمين (سابق)"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}

                    {idx < slides.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSlide(idx, idx + 1);
                        }}
                        className="p-1 hover:text-amber-400 text-slate-400 rounded"
                        title="تحريك لليسار (لاحق)"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSlide(slide.id);
                      }}
                      className="p-1 hover:text-amber-400 text-slate-400 rounded"
                      title="تكرار المشهد"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(slide.id);
                      }}
                      className="p-1 hover:text-rose-400 text-slate-400 rounded"
                      title="حذف المشهد"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inter-slide Transition Connector Indicator */}
              {idx < slides.length - 1 && (
                <div 
                  className="flex flex-col items-center justify-center p-1 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                  title={`انتقال: ${slide.transition}`}
                >
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono mt-0.5">{slide.transitionDuration}s</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add new slide quick card */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-36 h-[132px] rounded-xl border border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-slate-400 hover:text-amber-300 shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">إضافة صورة</span>
        </div>
      </div>
    </div>
  );
};
