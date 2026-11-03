import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Maximize, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Monitor, 
  Square,
  Sparkles
} from 'lucide-react';
import { SlideItem, ProjectSettings, AspectRatio } from '../types';
import { renderVideoFrame, getTotalDuration, getDimensionsForAspect, preloadAllImages } from '../utils/videoRenderer';
import { startSoundtrack, stopSoundtrack, updateSoundtrackVolume } from '../utils/audioEngine';

interface VideoPlayerProps {
  slides: SlideItem[];
  projectSettings: ProjectSettings;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number | ((prevTime: number) => number)) => void;
  onTogglePlay: () => void;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  onOpenAiDirector: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  slides,
  projectSettings,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onTogglePlay,
  onUpdateSettings,
  onOpenAiDirector,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const totalDuration = getTotalDuration(slides);

  // Preload images whenever slides change
  useEffect(() => {
    preloadAllImages(slides).then(() => {
      // Draw initial frame
      drawCurrentFrame();
    }).catch(err => {
      console.warn('Preload warning:', err);
    });
  }, [slides]);

  // Handle Audio soundtrack playback in sync with video play/pause
  useEffect(() => {
    if (isPlaying) {
      if (projectSettings.soundtrack !== 'none' && !isMuted) {
        startSoundtrack(projectSettings.soundtrack, projectSettings.soundtrackVolume);
      }
    } else {
      stopSoundtrack();
    }

    return () => {
      stopSoundtrack();
    };
  }, [isPlaying, projectSettings.soundtrack, isMuted]);

  useEffect(() => {
    updateSoundtrackVolume(isMuted ? 0 : projectSettings.soundtrackVolume);
  }, [projectSettings.soundtrackVolume, isMuted]);

  // Render frame helper
  const drawCurrentFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderVideoFrame(ctx, canvas, slides, currentTime, projectSettings);
  };

  // Redraw when currentTime or settings change while paused
  useEffect(() => {
    if (!isPlaying) {
      drawCurrentFrame();
    }
  }, [currentTime, projectSettings.aspectRatio, projectSettings.resolution, slides, isPlaying]);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      onTimeUpdate((prevTime) => {
        let nextTime = prevTime + dt;
        if (nextTime >= totalDuration) {
          nextTime = 0; // loop
        }
        return nextTime;
      });

      drawCurrentFrame();
      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isPlaying, totalDuration, slides, projectSettings]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Time format helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const { width: nativeWidth, height: nativeHeight } = getDimensionsForAspect(
    projectSettings.aspectRatio,
    projectSettings.resolution
  );

  // Aspect ratio container styles
  const getAspectClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16':
        return 'max-w-[340px] aspect-[9/16]';
      case '1:1':
        return 'max-w-[500px] aspect-square';
      case '4:5':
        return 'max-w-[420px] aspect-[4/5]';
      case '16:9':
      default:
        return 'w-full max-w-[840px] aspect-[16/9]';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden group ${
        isFullscreen ? 'h-screen w-screen p-8 rounded-none' : ''
      }`}
    >
      {/* Aspect Ratio Switcher (Top of player) */}
      <div className="w-full max-w-[840px] flex items-center justify-between pb-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => onUpdateSettings({ aspectRatio: '16:9' })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              projectSettings.aspectRatio === '16:9'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9 عريض</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aspectRatio: '9:16' })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              projectSettings.aspectRatio === '9:16'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 ريلز / تيك توك</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aspectRatio: '1:1' })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              projectSettings.aspectRatio === '1:1'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'hover:text-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1 مربع</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">الجودة:</span>
          <select
            value={projectSettings.resolution}
            onChange={(e) => onUpdateSettings({ resolution: e.target.value as '720p' | '1080p' })}
            className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-md text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="720p">HD (720p)</option>
            <option value="1080p">Full HD (1080p)</option>
          </select>
        </div>
      </div>

      {/* Main Screen Canvas Display */}
      <div className={`relative flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 transition-all duration-300 ${getAspectClass(projectSettings.aspectRatio)}`}>
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">ابدأ بتحويل صورك إلى فيديو</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                أضف صورك المفضلة من الأسفل، أو استخدم المخرج الذكي لتوليد قصة سينمائية بلمسة زر واحدة.
              </p>
            </div>
            <button
              onClick={onOpenAiDirector}
              className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors"
            >
              استعراض النماذج الجاهزة
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={nativeWidth}
            height={nativeHeight}
            onClick={onTogglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />
        )}

        {/* Center overlay big play button when paused */}
        {!isPlaying && slides.length > 0 && (
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-950/70 border border-amber-500/40 text-amber-400 flex items-center justify-center backdrop-blur-sm shadow-xl hover:scale-105 hover:bg-amber-500 hover:text-slate-950 transition-all"
            aria-label="تشغيل"
          >
            <Play className="w-8 h-8 translate-x-0.5 fill-current" />
          </button>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      {slides.length > 0 && (
        <div className="w-full max-w-[840px] flex items-center justify-between gap-4 mt-3 pt-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
            </button>

            <button
              onClick={() => onTimeUpdate(0)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="إعادة من البداية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => onTimeUpdate(Math.max(0, currentTime - 3))}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="تراجع 3 ثواني"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => onTimeUpdate(Math.min(totalDuration, currentTime + 3))}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="تقديم 3 ثواني"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <span className="font-mono text-slate-400 tabular-nums px-2">
              <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(totalDuration)}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Soundtrack indicator & mute */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 text-xs">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="hover:text-white transition-colors"
                title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <span className="text-[11px] text-slate-300">
                {projectSettings.soundtrack === 'none' ? 'بدون موسيقى' : `موسيقى: ${projectSettings.soundtrack}`}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="ملء الشاشة"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
