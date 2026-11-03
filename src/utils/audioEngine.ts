import { SoundtrackTheme } from '../types';

let audioCtx: AudioContext | null = null;
let musicInterval: number | null = null;
let activeNodes: (AudioNode | AudioScheduledSourceNode)[] = [];
let masterGain: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopSoundtrack() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  activeNodes.forEach(node => {
    try {
      if ('stop' in node && typeof (node as any).stop === 'function') {
        (node as any).stop();
      }
      node.disconnect();
    } catch {
      // ignore
    }
  });
  activeNodes = [];
}

/**
 * Procedural harmonic chord progression synthesizer for each theme
 */
export function startSoundtrack(
  theme: SoundtrackTheme, 
  volume: number = 0.5,
  destinationNode?: AudioNode
) {
  stopSoundtrack();
  if (theme === 'none' || theme === 'custom') return;

  const ctx = getAudioContext();
  const dest = destinationNode || ctx.destination;

  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  masterGain.connect(dest);

  // Musical notes in Hz
  const NOTES: Record<string, number> = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
  };

  // Chord sequences
  const progressions: Record<string, number[][]> = {
    epic: [
      [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4],
      [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4],
      [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4],
      [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4],
    ],
    lofi: [
      [NOTES.D3, NOTES.F3, NOTES.A3, NOTES.C4],
      [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.F4],
      [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.B3],
      [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.G4],
    ],
    piano: [
      [NOTES.C3, NOTES.G3, NOTES.E4, NOTES.G4],
      [NOTES.A3, NOTES.E4, NOTES.C4, NOTES.E5],
      [NOTES.F3, NOTES.C4, NOTES.A4, NOTES.C5],
      [NOTES.G3, NOTES.D4, NOTES.B4, NOTES.D5],
    ],
    acoustic: [
      [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4],
      [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.E4],
      [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4],
      [NOTES.D3, NOTES.F3, NOTES.A3, NOTES.D4],
    ],
    upbeat: [
      [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
      [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4],
      [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4],
      [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4],
    ],
  };

  const chords = progressions[theme] || progressions.epic;
  let chordIdx = 0;

  const playChord = () => {
    if (!masterGain) return;
    const currentChord = chords[chordIdx % chords.length];
    chordIdx++;

    currentChord.forEach((freq, noteIdx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      // Instrument waveform based on theme
      if (theme === 'piano') {
        osc.type = 'triangle';
      } else if (theme === 'epic') {
        osc.type = noteIdx === 0 ? 'sawtooth' : 'sine';
      } else if (theme === 'lofi') {
        osc.type = 'sine';
      } else {
        osc.type = 'triangle';
      }

      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Low pass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(theme === 'lofi' ? 800 : theme === 'epic' ? 1800 : 2500, ctx.currentTime);

      const delay = noteIdx * 0.08;
      const startTime = ctx.currentTime + delay;
      const duration = 2.4;

      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain!);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);

      activeNodes.push(osc, filter, noteGain);
    });
  };

  playChord();
  musicInterval = window.setInterval(playChord, 2200);
}

export function updateSoundtrackVolume(volume: number) {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(volume * 0.4, audioCtx.currentTime);
  }
}
