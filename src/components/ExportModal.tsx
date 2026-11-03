import React from 'react';
import { Download, X, Film, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { ExportProgress, ProjectSettings } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportProgress: ExportProgress;
  projectSettings: ProjectSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportProgress,
  projectSettings,
}) => {
  if (!isOpen) return null;

  const isCompleted = exportProgress.progress >= 100 && !!exportProgress.downloadUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isCompleted ? 'اكتمل تصدير الفيديو بنجاح!' : 'جاري معالجة وتصدير الفيديو...'}
              </h2>
              <p className="text-xs text-slate-400">
                دقة {projectSettings.resolution} · أبعاد {projectSettings.aspectRatio}
              </p>
            </div>
          </div>
          {!exportProgress.isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="py-6 flex flex-col items-center justify-center gap-5 text-center">
          {exportProgress.isExporting && !isCompleted && (
            <div className="w-full flex flex-col items-center gap-4">
              {/* Progress Ring or Bar */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                <div 
                  className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"
                  style={{ animationDuration: '2s' }}
                />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold font-mono text-white tabular-nums">
                    {exportProgress.progress}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {exportProgress.renderedFrames} / {exportProgress.totalFrames} إطار
                  </span>
                </div>
              </div>

              {/* Linear progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${exportProgress.progress}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 max-w-sm">
                يتم الآن دمج حركات الكاميرا والانتقالات والمؤثرات الصوتية بدقة سينمائية عالية. يرجى الانتظار ثوانٍ معدودة...
              </p>
            </div>
          )}

          {isCompleted && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1">الفيديو جاهز للمشاهدة والتنزيل</h3>
                <p className="text-xs text-slate-400 font-mono">
                  الملف: {exportProgress.fileName || 'picmotion-video.webm'}
                </p>
              </div>

              {/* Video Preview */}
              {exportProgress.downloadUrl && (
                <div className="w-full max-h-56 rounded-xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                  <video
                    src={exportProgress.downloadUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Download CTA Button */}
              {exportProgress.downloadUrl && (
                <a
                  href={exportProgress.downloadUrl}
                  download={exportProgress.fileName || 'picmotion-video.webm'}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الفيديو الآن إلى جهازك</span>
                </a>
              )}
            </div>
          )}

          {exportProgress.error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{exportProgress.error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            {isCompleted ? 'إغلاق ومتابعة التعديل' : 'إلغاء'}
          </button>
        </div>
      </div>
    </div>
  );
};
