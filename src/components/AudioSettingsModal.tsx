import React, { useState, useRef } from 'react';
import { Music, X, Volume2, Upload, Mic, Square, Play, Check } from 'lucide-react';
import { ProjectSettings, SoundtrackTheme } from '../types';
import { startSoundtrack, stopSoundtrack } from '../utils/audioEngine';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectSettings: ProjectSettings;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  projectSettings,
  onUpdateSettings,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<SoundtrackTheme>(projectSettings.soundtrack);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const soundtracks: { id: SoundtrackTheme; label: string; desc: string }[] = [
    { id: 'epic', label: 'ملحمي سينمائي (Epic)', desc: 'أوركسترا عميقة تناسب المناظر الطبيعية والمشاهد المهيبة' },
    { id: 'lofi', label: 'لوفي هادئ (Lo-Fi)', desc: 'إيقاع استرخائي ودافئ لليوميات ولحظات القهوة' },
    { id: 'piano', label: 'بيانو رومانسي (Piano)', desc: 'ألحان بيانو انسيابية شاعرية مليئة بالعاطفة' },
    { id: 'acoustic', label: 'أوتار جيتار (Acoustic)', desc: 'نغمات خشبية طبيعية للمغامرات والذكريات' },
    { id: 'upbeat', label: 'إيقاع حماسي (Upbeat)', desc: 'موسيقى عصرية تنبض بالحيوية للرحلات والتحديات' },
    { id: 'none', label: 'بدون موسيقى خلفية', desc: 'كتم الموسيقى والتركيز على نقاء الفيديو أو التعليق' },
  ];

  const handleTestPlay = (theme: SoundtrackTheme) => {
    if (isPlayingPreview && previewTheme === theme) {
      stopSoundtrack();
      setIsPlayingPreview(false);
    } else {
      setPreviewTheme(theme);
      startSoundtrack(theme, projectSettings.soundtrackVolume);
      setIsPlayingPreview(true);
    }
  };

  const handleSelectTheme = (theme: SoundtrackTheme) => {
    onUpdateSettings({ soundtrack: theme, customAudioUrl: undefined, customAudioName: undefined });
    if (isPlayingPreview) {
      startSoundtrack(theme, projectSettings.soundtrackVolume);
      setPreviewTheme(theme);
    }
  };

  // Custom audio upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onUpdateSettings({
        soundtrack: 'custom',
        customAudioUrl: url,
        customAudioName: file.name,
      });
    }
  };

  // Microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('يرجى السماح بالوصول إلى الميكروفون لتسجيل الصوت.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const applyRecordedAudio = () => {
    if (recordedAudioUrl) {
      onUpdateSettings({
        soundtrack: 'custom',
        customAudioUrl: recordedAudioUrl,
        customAudioName: 'تسجيل صوتي حي من الميكروفون',
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">الموسيقى والصوتيات (Audio Studio)</h2>
              <p className="text-xs text-slate-400">
                اختيار الموسيقى التصويرية، رفع ملف صوتي خاص، أو التسجيل بالمايكروفون
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSoundtrack();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-5 scrollbar-thin">
          {/* Master Volume */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>مستوى صوت الموسيقى والخلفية:</span>
              </label>
              <span className="font-mono text-emerald-400">
                {Math.round(projectSettings.soundtrackVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={projectSettings.soundtrackVolume}
              onChange={(e) => onUpdateSettings({ soundtrackVolume: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Soundtracks List */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اختر الموسيقى التصويرية المدمجة:
            </label>
            <div className="flex flex-col gap-2">
              {soundtracks.map((st) => {
                const isSelected = projectSettings.soundtrack === st.id;
                const isPlayingThis = isPlayingPreview && previewTheme === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => handleSelectTheme(st.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <span>{st.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{st.desc}</div>
                    </div>

                    {st.id !== 'none' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestPlay(st.id);
                        }}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                          isPlayingThis
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={isPlayingThis ? 'إيقاف المعاينة' : 'معاينة النغمة'}
                      >
                        {isPlayingThis ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span className="text-[10px]">{isPlayingThis ? 'إيقاف' : 'استماع'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload Custom Audio */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              أو ارفع ملف صوتي خاص بك (MP3 / WAV):
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>اختيار ملف صوتي من الجهاز</span>
              </button>

              {projectSettings.customAudioName && (
                <span className="text-xs text-emerald-400 truncate max-w-xs font-mono">
                  {projectSettings.customAudioName}
                </span>
              )}
            </div>
          </div>

          {/* Microphone Live Voice Recorder */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              تسجيل تعليق صوتي حي بصوتك (Microphone):
            </label>
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 rounded-xl text-xs font-medium transition-colors"
                >
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  <span>بدء التسجيل الآن</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>إيقاف التسجيل</span>
                </button>
              )}

              {recordedAudioUrl && (
                <div className="flex items-center gap-2">
                  <audio src={recordedAudioUrl} controls className="h-8 w-44" />
                  <button
                    onClick={applyRecordedAudio}
                    className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-semibold rounded-lg text-xs"
                  >
                    استخدام التسجيل
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              stopSoundtrack();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
          >
            تم وحفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};
