import { SlideItem, ProjectSettings, CameraMotion, TransitionType, ColorFilter, AspectRatio } from '../types';
import { startSoundtrack, stopSoundtrack, getAudioContext } from './audioEngine';

// Image cache to avoid re-fetching
const imageCache = new Map<string, HTMLImageElement>();

export function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

export function preloadAllImages(slides: SlideItem[]): Promise<HTMLImageElement[]> {
  return Promise.all(slides.map(s => preloadImage(s.imageUrl)));
}

export function getTotalDuration(slides: SlideItem[]): number {
  if (slides.length === 0) return 0;
  // Total duration is sum of durations minus overlapping transitions
  let total = 0;
  for (let i = 0; i < slides.length; i++) {
    total += slides[i].duration;
    if (i < slides.length - 1) {
      // Transition overlap
      total -= Math.min(slides[i].transitionDuration, slides[i].duration * 0.4);
    }
  }
  return Math.max(0.1, total);
}

export function getDimensionsForAspect(aspectRatio: AspectRatio, resolution: '720p' | '1080p'): { width: number; height: number } {
  const is1080 = resolution === '1080p';
  switch (aspectRatio) {
    case '9:16':
      return is1080 ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
    case '1:1':
      return is1080 ? { width: 1080, height: 1080 } : { width: 720, height: 720 };
    case '4:5':
      return is1080 ? { width: 1080, height: 1350 } : { width: 720, height: 900 };
    case '16:9':
    default:
      return is1080 ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
  }
}

interface SlideTimelineSegment {
  slide: SlideItem;
  index: number;
  startTime: number;
  endTime: number;
  transitionStartTime: number;
  transitionEndTime: number;
}

export function computeSlideTimeline(slides: SlideItem[]): SlideTimelineSegment[] {
  const segments: SlideTimelineSegment[] = [];
  let currentTime = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const duration = slide.duration;
    const transDuration = i < slides.length - 1 
      ? Math.min(slide.transitionDuration, duration * 0.4) 
      : 0;

    const startTime = currentTime;
    const endTime = startTime + duration;
    const transitionStartTime = endTime - transDuration;
    const transitionEndTime = endTime;

    segments.push({
      slide,
      index: i,
      startTime,
      endTime,
      transitionStartTime,
      transitionEndTime,
    });

    currentTime = transitionStartTime;
  }

  return segments;
}

/**
 * Draw a single image with Ken Burns camera motion & color filter
 */
function drawSlideImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  motion: CameraMotion,
  filter: ColorFilter,
  progress: number, // 0 to 1 across this slide's duration
  width: number,
  height: number,
  alpha: number = 1
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  // 1. Calculate Ken Burns transforms
  let scale = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;

  const t = Math.max(0, Math.min(1, progress));

  switch (motion) {
    case 'zoom_in':
      scale = 1.0 + 0.22 * t;
      break;
    case 'zoom_out':
      scale = 1.22 - 0.22 * t;
      break;
    case 'pan_left':
      scale = 1.15;
      offsetX = (0.06 - 0.12 * t) * width;
      break;
    case 'pan_right':
      scale = 1.15;
      offsetX = (-0.06 + 0.12 * t) * width;
      break;
    case 'tilt_up':
      scale = 1.18;
      offsetY = (0.08 - 0.16 * t) * height;
      break;
    case 'dynamic_drift':
      scale = 1.12 + 0.1 * t;
      offsetX = (-0.04 + 0.08 * t) * width;
      offsetY = (0.03 - 0.06 * t) * height;
      rotation = (t - 0.5) * 0.015;
      break;
    case 'pulse':
      scale = 1.08 + Math.sin(t * Math.PI * 2) * 0.06;
      break;
  }

  // 2. Cover-fit image math
  const imgAspect = img.width / img.height;
  const canvasAspect = width / height;

  let drawW = width;
  let drawH = height;

  if (imgAspect > canvasAspect) {
    drawH = height;
    drawW = height * imgAspect;
  } else {
    drawW = width;
    drawH = width / imgAspect;
  }

  // Apply camera matrix
  ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
  if (rotation !== 0) ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // Apply filters via canvas context if supported
  let filterCss = 'none';
  switch (filter) {
    case 'cinematic_warm':
      filterCss = 'sepia(0.25) contrast(1.1) brightness(1.05) saturate(1.2)';
      break;
    case 'noir_bw':
      filterCss = 'grayscale(1) contrast(1.25) brightness(0.95)';
      break;
    case 'vintage_film':
      filterCss = 'sepia(0.4) contrast(0.95) saturate(0.85) brightness(1.02)';
      break;
    case 'vibrant_pop':
      filterCss = 'saturate(1.4) contrast(1.12) brightness(1.02)';
      break;
    case 'golden_hour':
      filterCss = 'sepia(0.3) saturate(1.35) hue-rotate(-12deg) brightness(1.08)';
      break;
    case 'cyberpunk':
      filterCss = 'contrast(1.2) hue-rotate(180deg) saturate(1.3)';
      break;
  }

  if (filterCss !== 'none') {
    ctx.filter = filterCss;
  }

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Subtle cinematic vignette
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.4,
    width / 2, height / 2, Math.max(width, height) * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw Text & Caption Overlays
 */
function drawSlideText(
  ctx: CanvasRenderingContext2D,
  slide: SlideItem,
  progress: number,
  width: number,
  height: number
) {
  if (!slide.title && !slide.subtitle) return;

  const t = Math.max(0, Math.min(1, progress));

  // Determine text animation factor
  let textAlpha = 1.0;
  let textOffsetY = 0;

  if (slide.textAnimation === 'fade') {
    textAlpha = t < 0.15 ? t / 0.15 : t > 0.88 ? (1 - t) / 0.12 : 1.0;
  } else if (slide.textAnimation === 'slide_up') {
    textAlpha = t < 0.2 ? t / 0.2 : t > 0.88 ? (1 - t) / 0.12 : 1.0;
    textOffsetY = t < 0.2 ? (1 - t / 0.2) * 30 : 0;
  }

  ctx.save();
  ctx.globalAlpha = textAlpha;

  let posY = height * 0.82;
  if (slide.textPosition === 'top') {
    posY = height * 0.18;
  } else if (slide.textPosition === 'center') {
    posY = height * 0.5;
  }

  posY += textOffsetY;

  // Background scrim behind text for crystal-clear readability
  const scrimHeight = 160;
  const scrimGrad = ctx.createLinearGradient(0, posY - 70, 0, posY + 90);
  scrimGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
  scrimGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.65)');
  scrimGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = scrimGrad;
  ctx.fillRect(0, posY - 70, width, scrimHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  if (slide.title) {
    const titleSize = Math.max(22, Math.round(width * 0.038));
    ctx.font = `700 ${titleSize}px 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif`;
    
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(slide.title, width / 2, posY - 18);
  }

  // Subtitle / Narration
  if (slide.subtitle) {
    let displaySub = slide.subtitle;
    if (slide.textAnimation === 'typewriter') {
      const charCount = Math.floor(Math.min(1, t / 0.7) * slide.subtitle.length);
      displaySub = slide.subtitle.slice(0, charCount);
    }

    const subSize = Math.max(15, Math.round(width * 0.022));
    ctx.font = `500 ${subSize}px 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif`;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(displaySub, width / 2, posY + 22);
  }

  ctx.restore();
}

/**
 * Render complete frame onto any canvas at specified time
 */
export function renderVideoFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  slides: SlideItem[],
  currentTime: number,
  _projectSettings: ProjectSettings
) {
  const width = canvas.width;
  const height = canvas.height;

  // Clear background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);

  if (slides.length === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('لا توجد صور في المخطط الزمني', width / 2, height / 2);
    return;
  }

  const timeline = computeSlideTimeline(slides);
  const totalDuration = getTotalDuration(slides);
  const clampedTime = Math.max(0, Math.min(currentTime, totalDuration));

  // Find active segment
  let currentSegment = timeline[0];
  let nextSegment: SlideTimelineSegment | null = null;

  for (let i = 0; i < timeline.length; i++) {
    const seg = timeline[i];
    if (clampedTime >= seg.startTime && clampedTime <= seg.endTime) {
      currentSegment = seg;
      if (clampedTime >= seg.transitionStartTime && i < timeline.length - 1) {
        nextSegment = timeline[i + 1];
      }
      break;
    }
  }

  const curImg = imageCache.get(currentSegment.slide.imageUrl);
  const curSlide = currentSegment.slide;
  const curProgress = (clampedTime - currentSegment.startTime) / curSlide.duration;

  // Check if we are in transition zone
  const isTransitioning = nextSegment !== null && clampedTime >= currentSegment.transitionStartTime;

  if (!isTransitioning || !nextSegment) {
    // Normal single slide rendering
    if (curImg) {
      drawSlideImage(ctx, curImg, curSlide.motion, curSlide.filter, curProgress, width, height, 1.0);
    }
    drawSlideText(ctx, curSlide, curProgress, width, height);
  } else {
    // Transition between curSlide and nextSlide
    const nextImg = imageCache.get(nextSegment.slide.imageUrl);
    const nextSlide = nextSegment.slide;
    const transDuration = currentSegment.transitionEndTime - currentSegment.transitionStartTime;
    const transProgress = Math.max(0, Math.min(1, (clampedTime - currentSegment.transitionStartTime) / transDuration));
    const nextProgress = (clampedTime - nextSegment.startTime) / nextSlide.duration;

    const transType = curSlide.transition;

    switch (transType) {
      case 'slide_left': {
        // Current slides out to left (-width * transProgress), Next slides in from right
        if (curImg) {
          ctx.save();
          ctx.translate(-width * transProgress, 0);
          drawSlideImage(ctx, curImg, curSlide.motion, curSlide.filter, curProgress, width, height, 1.0);
          drawSlideText(ctx, curSlide, curProgress, width, height);
          ctx.restore();
        }
        if (nextImg) {
          ctx.save();
          ctx.translate(width * (1 - transProgress), 0);
          drawSlideImage(ctx, nextImg, nextSlide.motion, nextSlide.filter, nextProgress, width, height, 1.0);
          drawSlideText(ctx, nextSlide, nextProgress, width, height);
          ctx.restore();
        }
        break;
      }

      case 'slide_right': {
        if (curImg) {
          ctx.save();
          ctx.translate(width * transProgress, 0);
          drawSlideImage(ctx, curImg, curSlide.motion, curSlide.filter, curProgress, width, height, 1.0);
          drawSlideText(ctx, curSlide, curProgress, width, height);
          ctx.restore();
        }
        if (nextImg) {
          ctx.save();
          ctx.translate(-width * (1 - transProgress), 0);
          drawSlideImage(ctx, nextImg, nextSlide.motion, nextSlide.filter, nextProgress, width, height, 1.0);
          drawSlideText(ctx, nextSlide, nextProgress, width, height);
          ctx.restore();
        }
        break;
      }

      case 'zoom_through': {
        // Current zooms in aggressively and fades out
        if (curImg) {
          drawSlideImage(ctx, curImg, curSlide.motion, curSlide.filter, curProgress + transProgress * 0.5, width, height, 1 - transProgress);
          drawSlideText(ctx, curSlide, curProgress, width, height);
        }
        if (nextImg) {
          drawSlideImage(ctx, nextImg, nextSlide.motion, nextSlide.filter, nextProgress, width, height, transProgress);
          drawSlideText(ctx, nextSlide, nextProgress, width, height);
        }
        break;
      }

      case 'wipe_left': {
        if (curImg) {
          drawSlideImage(ctx, curImg, curSlide.motion, curSlide.filter, curProgress, width, height, 1.0);
          drawSlideText(ctx, curSlide, curProgress, width, height);
        }
        if (nextImg) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, width * transProgress, height);
          ctx.clip();
          drawSlideImage(ctx, nextImg, nextSlide.motion, nextSlide.filter, nextProgress, width, height, 1.0);
          drawSlideText(ctx, nextSlide, nextProgress, width, height);
          ctx.restore();
        }
        break;
      }

      case 'fade_black': {
        if (transProgress < 0.5) {
          const fadeOut = 1 - transProgress * 2;
          if (curImg) {
            drawSlideImage(ctx, curImg, curSlide.motion, curSlide.filter, curProgress, width, height, fadeOut);
            drawSlideText(ctx, curSlide, curProgress, width, height);
          }
        } else {
          const fadeIn = (transProgress - 0.5) * 2;
          if (nextImg) {
            drawSlideImage(ctx, nextImg, nextSlide.motion, nextSlide.filter, nextProgress, width, height, fadeIn);
            drawSlideText(ctx, nextSlide, nextProgress, width, height);
          }
        }
        break;
      }

      case 'crossfade':
      default: {
        // Crossfade
        if (curImg) {
          drawSlideImage(ctx, curImg, curSlide.motion, curSlide.filter, curProgress, width, height, 1.0);
          drawSlideText(ctx, curSlide, curProgress, width, height);
        }
        if (nextImg) {
          drawSlideImage(ctx, nextImg, nextSlide.motion, nextSlide.filter, nextProgress, width, height, transProgress);
          drawSlideText(ctx, nextSlide, nextProgress, width, height);
        }
        break;
      }
    }
  }
}

/**
 * High-definition Video Export via Canvas MediaRecorder + Web Audio
 */
export async function exportVideoRecording(
  slides: SlideItem[],
  projectSettings: ProjectSettings,
  onProgress: (progress: number, frame: number, total: number) => void
): Promise<{ url: string; fileName: string; blob: Blob }> {
  // Preload images first
  await preloadAllImages(slides);

  const totalDuration = getTotalDuration(slides);
  const fps = 30;
  const totalFrames = Math.ceil(totalDuration * fps);

  // Set up export canvas
  const { width, height } = getDimensionsForAspect(projectSettings.aspectRatio, projectSettings.resolution);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Set up audio destination
  const audioCtx = getAudioContext();
  const dest = audioCtx.createMediaStreamDestination();

  // Connect soundtrack to export stream
  if (projectSettings.soundtrack !== 'none' && projectSettings.soundtrack !== 'custom') {
    startSoundtrack(projectSettings.soundtrack, projectSettings.soundtrackVolume, dest);
  }

  // Handle custom audio or voiceovers if any
  let customAudioEl: HTMLAudioElement | null = null;
  if (projectSettings.customAudioUrl) {
    customAudioEl = new Audio(projectSettings.customAudioUrl);
    customAudioEl.volume = projectSettings.soundtrackVolume;
    const source = audioCtx.createMediaElementSource(customAudioEl);
    source.connect(dest);
    customAudioEl.play();
  }

  // Capture canvas video stream
  const canvasStream = canvas.captureStream(fps);
  
  // Combine canvas video track + destination audio track
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  // Determine mimeType supported by browser
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: projectSettings.resolution === '1080p' ? 8_000_000 : 4_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start();

  // Render loop
  const frameIntervalMs = 1000 / fps;
  let currentFrame = 0;

  return new Promise((resolve, reject) => {
    const renderNextFrame = () => {
      if (currentFrame >= totalFrames) {
        // Complete
        recorder.onstop = () => {
          stopSoundtrack();
          if (customAudioEl) {
            customAudioEl.pause();
          }
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const cleanTitle = (projectSettings.title || 'picmotion-video').toLowerCase().replace(/\s+/g, '-');
          resolve({
            url,
            fileName: `${cleanTitle}.${ext}`,
            blob,
          });
        };
        recorder.stop();
        return;
      }

      const currentTime = currentFrame / fps;
      renderVideoFrame(ctx, canvas, slides, currentTime, projectSettings);

      currentFrame++;
      const progressPercent = Math.round((currentFrame / totalFrames) * 100);
      onProgress(progressPercent, currentFrame, totalFrames);

      setTimeout(renderNextFrame, frameIntervalMs);
    };

    renderNextFrame();
  });
}
