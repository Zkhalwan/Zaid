import React from 'react';
import { Sparkles, X, Plus, Check } from 'lucide-react';
import { PRESET_THEMES, SAMPLE_IMAGES } from '../utils/sampleData';
import { SlideItem } from '../types';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPresetImage: (imageKey: keyof typeof SAMPLE_IMAGES, title: string, subtitle: string) => void;
  onLoadFullPreset: (presetId: string) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onAddPresetImage,
  onLoadFullPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">النماذج والصور الجاهزة للإنتاج</h2>
              <p className="text-xs text-slate-400">
                استخدم لقطات سينمائية عالية الدقة جاهزة للتجربة والإنتاج الفوري
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-4 scrollbar-thin">
          <span className="text-xs font-semibold text-slate-300">
            انقر لإضافة أي مشهد إلى الفيديو الحالي:
          </span>

          <div className="grid grid-cols-2 gap-3">
            {PRESET_THEMES.map((theme) => (
              <div
                key={theme.id}
                className="group relative rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-400/60 bg-slate-950 transition-all flex flex-col"
              >
                <div className="w-full h-28 overflow-hidden relative">
                  <img
                    src={theme.image}
                    alt={theme.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <span className="absolute bottom-2 right-2 text-xs font-bold text-white">
                    {theme.title}
                  </span>
                </div>

                <div className="p-3 flex flex-col gap-2 flex-1 justify-between text-xs">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {theme.desc}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        const key = theme.id === 'nature_alps' ? 'nature' : theme.id === 'cyberpunk' ? 'cyberpunk' : theme.id === 'heritage' ? 'heritage' : 'coffee';
                        onAddPresetImage(key as any, theme.title, theme.desc);
                        onClose();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة المشهد</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
