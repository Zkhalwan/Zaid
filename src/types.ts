export type CameraMotion = 
  | 'zoom_in' 
  | 'zoom_out' 
  | 'pan_left' 
  | 'pan_right' 
  | 'tilt_up' 
  | 'dynamic_drift'
  | 'pulse';

export type TransitionType = 
  | 'crossfade' 
  | 'slide_left' 
  | 'slide_right' 
  | 'zoom_through' 
  | 'wipe_left' 
  | 'fade_black';

export type ColorFilter = 
  | 'none' 
  | 'cinematic_warm' 
  | 'noir_bw' 
  | 'vintage_film' 
  | 'vibrant_pop' 
  | 'golden_hour' 
  | 'cyberpunk';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type TextPosition = 'bottom' | 'center' | 'top';

export type TextAnimation = 'fade' | 'slide_up' | 'typewriter' | 'none';

export type SoundtrackTheme = 'epic' | 'lofi' | 'upbeat' | 'acoustic' | 'piano' | 'custom' | 'none';

export type TextFontFamily = 
  | 'Cairo' 
  | 'Tajawal' 
  | 'Amiri' 
  | 'Almarai' 
  | 'Plus Jakarta Sans' 
  | 'JetBrains Mono';

export type TextAlignment = 'center' | 'right' | 'left';
export type TextBackgroundStyle = 'scrim' | 'card' | 'none';

export interface SlideItem {
  id: string;
  imageUrl: string;
  name?: string;
  title: string;
  subtitle: string;
  duration: number; // in seconds (e.g. 3.5)
  motion: CameraMotion;
  transition: TransitionType;
  transitionDuration: number; // in seconds (e.g. 0.8)
  filter: ColorFilter;
  textPosition: TextPosition;
  textOffsetY?: number; // -40% to +40% custom vertical offset
  textAlign?: TextAlignment;
  fontFamily?: TextFontFamily;
  titleFontSize?: number; // relative size scale 20 - 64 (default 36)
  subtitleFontSize?: number; // relative size scale 12 - 32 (default 20)
  titleColor?: string; // hex color code
  subtitleColor?: string; // hex color code
  textBgStyle?: TextBackgroundStyle;
  textAnimation: TextAnimation;
  voiceoverAudioUrl?: string;
  voiceoverText?: string;
}

export interface ProjectSettings {
  title: string;
  aspectRatio: AspectRatio;
  soundtrack: SoundtrackTheme;
  soundtrackVolume: number; // 0 to 1
  voiceoverVolume: number; // 0 to 1
  customAudioUrl?: string;
  customAudioName?: string;
  resolution: '720p' | '1080p';
}

export interface ExportProgress {
  isExporting: boolean;
  progress: number;
  renderedFrames: number;
  totalFrames: number;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  timestamp: string; // ISO date string
  author: 'user' | 'ai';
  authorName: string;
  changeDescription: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface AppDocument {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  versions: DocumentVersion[];
}

