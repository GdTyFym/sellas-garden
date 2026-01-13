import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';

type UseGardenAudioOptions = {
  baseVolume: number;
  duckVolume: number;
  maxConcurrentSfx?: number;
};

type AudioRefs = {
  bgmRef: RefObject<HTMLAudioElement>;
  popRef: RefObject<HTMLAudioElement>;
  sparkleRef: RefObject<HTMLAudioElement>;
  paperRef: RefObject<HTMLAudioElement>;
  finaleRef: RefObject<HTMLAudioElement>;
  voiceRef: RefObject<HTMLAudioElement>;
};

type AudioState = {
  isMuted: boolean;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
  isVoicePlaying: boolean;
};

type AudioActions = {
  primeAudio: () => void;
  startBgm: () => void;
  playSfx: (
    ref: RefObject<HTMLAudioElement>,
    options?: { volume?: number; rateMin?: number; rateMax?: number }
  ) => void;
  fadeBgmTo: (targetVolume: number, duration?: number) => void;
  toggleVoice: () => void;
};

export function useGardenAudio({
  baseVolume,
  duckVolume,
  maxConcurrentSfx = 6
}: UseGardenAudioOptions) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const popRef = useRef<HTMLAudioElement | null>(null);
  const sparkleRef = useRef<HTMLAudioElement | null>(null);
  const paperRef = useRef<HTMLAudioElement | null>(null);
  const finaleRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const bgmFadeRef = useRef<number | null>(null);
  const hasStartedAudioRef = useRef(false);
  const wasBgmPlayingRef = useRef(false);
  const wasVoicePlayingRef = useRef(false);
  const sfxNodesRef = useRef<Set<HTMLAudioElement>>(new Set());

  const cleanupSfxNode = useCallback((node: HTMLAudioElement) => {
    node.pause();
    node.onended = null;
    node.removeAttribute('src');
    node.src = '';
    node.load();
    sfxNodesRef.current.delete(node);
  }, []);

  const clearBgmFade = useCallback(() => {
    if (bgmFadeRef.current) {
      window.clearInterval(bgmFadeRef.current);
      bgmFadeRef.current = null;
    }
  }, []);

  const fadeBgmTo = useCallback(
    (targetVolume: number, duration = 1400) => {
      const bgm = bgmRef.current;
      if (!bgm) return;
      clearBgmFade();
      const start = bgm.volume;
      const steps = 28;
      let step = 0;
      bgmFadeRef.current = window.setInterval(() => {
        step += 1;
        const next = start + (targetVolume - start) * (step / steps);
        bgm.volume = Math.max(0, Math.min(1, next));
        if (step >= steps) {
          clearBgmFade();
        }
      }, duration / steps);
    },
    [clearBgmFade]
  );

  const primeAudio = useCallback(() => {
    [bgmRef, popRef, sparkleRef, paperRef, finaleRef, voiceRef].forEach((ref) => {
      ref.current?.load();
    });
  }, []);

  const startBgm = useCallback(() => {
    const bgm = bgmRef.current;
    if (!bgm || isMuted) return;
    if (!hasStartedAudioRef.current) {
      hasStartedAudioRef.current = true;
      bgm.volume = 0;
      bgm.loop = true;
    }
    const playPromise = bgm.play();
    if (playPromise) {
      playPromise
        .then(() => {
          wasBgmPlayingRef.current = true;
        })
        .catch(() => {});
    } else {
      wasBgmPlayingRef.current = true;
    }
    fadeBgmTo(baseVolume, 1600);
  }, [baseVolume, fadeBgmTo, isMuted]);

  const playSfx = useCallback(
    (
      ref: React.RefObject<HTMLAudioElement>,
      options: { volume?: number; rateMin?: number; rateMax?: number } = {}
    ) => {
      if (isMuted) return;
      if (sfxNodesRef.current.size >= Math.max(1, maxConcurrentSfx)) return;
      const base = ref.current;
      if (!base) return;
      const node = base.cloneNode(true) as HTMLAudioElement;
      const volume = options.volume ?? 0.5;
      const rateMin = options.rateMin ?? 0.96;
      const rateMax = options.rateMax ?? 1.04;
      node.volume = Math.max(0, Math.min(1, volume));
      node.playbackRate = rateMin + Math.random() * (rateMax - rateMin);
      node.muted = false;
      node.onended = () => cleanupSfxNode(node);
      sfxNodesRef.current.add(node);
      const playPromise = node.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    },
    [cleanupSfxNode, isMuted, maxConcurrentSfx]
  );

  const toggleVoice = useCallback(() => {
    const voice = voiceRef.current;
    if (!voice) return;
    const primeVoice = () => {
      if (voice.preload === 'none') {
        voice.preload = 'auto';
      }
      if (voice.readyState === 0) {
        voice.load();
      }
      if (
        voice.ended ||
        (Number.isFinite(voice.duration) && voice.duration > 0 && voice.currentTime >= voice.duration)
      ) {
        voice.currentTime = 0;
      }
    };
    if (isMuted) {
      setIsMuted(false);
      voice.muted = false;
      primeVoice();
      const playPromise = voice.play();
      if (playPromise) {
        playPromise
          .then(() => {
            wasVoicePlayingRef.current = true;
          })
          .catch(() => {});
      } else {
        wasVoicePlayingRef.current = true;
      }
      return;
    }
    if (voice.paused) {
      voice.muted = false;
      primeVoice();
      const playPromise = voice.play();
      if (playPromise) {
        playPromise
          .then(() => {
            wasVoicePlayingRef.current = true;
          })
          .catch(() => {});
      } else {
        wasVoicePlayingRef.current = true;
      }
    } else {
      voice.pause();
      wasVoicePlayingRef.current = false;
    }
  }, [isMuted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bgm = bgmRef.current;
    if (!bgm) return;
    bgm.muted = isMuted;
    if (isMuted) {
      bgm.pause();
      wasBgmPlayingRef.current = false;
      if (voiceRef.current) {
        voiceRef.current.pause();
        wasVoicePlayingRef.current = false;
      }
      clearBgmFade();
      return;
    }
    if (hasStartedAudioRef.current) {
      const playPromise = bgm.play();
      if (playPromise) {
        playPromise
          .then(() => {
            wasBgmPlayingRef.current = true;
          })
          .catch(() => {});
      } else {
        wasBgmPlayingRef.current = true;
      }
      fadeBgmTo(baseVolume, 1000);
    }
  }, [baseVolume, clearBgmFade, fadeBgmTo, isMuted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const voice = voiceRef.current;
    if (!voice) return;

    const handlePlay = () => {
      setIsVoicePlaying(true);
      wasVoicePlayingRef.current = true;
      fadeBgmTo(duckVolume, 600);
    };
    const handleStop = () => {
      setIsVoicePlaying(false);
      wasVoicePlayingRef.current = false;
      fadeBgmTo(baseVolume, 800);
    };

    voice.addEventListener('play', handlePlay);
    voice.addEventListener('pause', handleStop);
    voice.addEventListener('ended', handleStop);

    return () => {
      voice.removeEventListener('play', handlePlay);
      voice.removeEventListener('pause', handleStop);
      voice.removeEventListener('ended', handleStop);
    };
  }, [baseVolume, duckVolume, fadeBgmTo]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePauseForBackground = () => {
      const bgm = bgmRef.current;
      const voice = voiceRef.current;
      wasBgmPlayingRef.current = !!bgm && !bgm.paused && !bgm.ended;
      wasVoicePlayingRef.current = !!voice && !voice.paused && !voice.ended;
      if (bgm) {
        clearBgmFade();
        bgm.pause();
      }
      if (voice) {
        voice.pause();
      }
      if (sfxNodesRef.current.size > 0) {
        const activeNodes = Array.from(sfxNodesRef.current);
        activeNodes.forEach((node) => cleanupSfxNode(node));
      }
    };

    const handleResumeFromBackground = () => {
      if (document.hidden || isMuted) return;
      const bgm = bgmRef.current;
      if (bgm && wasBgmPlayingRef.current) {
        const playPromise = bgm.play();
        if (playPromise) {
          playPromise
            .then(() => {
              wasBgmPlayingRef.current = true;
            })
            .catch(() => {});
        }
      }
      const voice = voiceRef.current;
      if (voice && wasVoicePlayingRef.current) {
        const playPromise = voice.play();
        if (playPromise) {
          playPromise
            .then(() => {
              wasVoicePlayingRef.current = true;
            })
            .catch(() => {});
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handlePauseForBackground();
      } else {
        handleResumeFromBackground();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePauseForBackground);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePauseForBackground);
    };
  }, [clearBgmFade, cleanupSfxNode, isMuted]);

  useEffect(() => {
    return () => {
      if (bgmFadeRef.current) {
        window.clearInterval(bgmFadeRef.current);
        bgmFadeRef.current = null;
      }
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
      if (voiceRef.current) {
        voiceRef.current.pause();
      }
    };
  }, []);

  const refs: AudioRefs = {
    bgmRef,
    popRef,
    sparkleRef,
    paperRef,
    finaleRef,
    voiceRef
  };

  const state: AudioState = {
    isMuted,
    setIsMuted,
    isVoicePlaying
  };

  const actions: AudioActions = {
    primeAudio,
    startBgm,
    playSfx,
    fadeBgmTo,
    toggleVoice
  };

  return { refs, state, actions };
}
