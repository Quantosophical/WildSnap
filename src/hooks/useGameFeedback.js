import { useCallback } from 'react';


// Instead of huge base64, we synthesize a clean tick and chime using Web Audio API
// This sounds exactly like a high-quality external UI asset but loads instantly.
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (frequency, type, duration, vol = 0.1) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};

export const useGameFeedback = () => {
  const playClick = useCallback(() => {
    // A clean, soft 'tick' sound (like an external UI click)
    playTone(600, 'sine', 0.05, 0.05);
    playTone(800, 'sine', 0.05, 0.05); // slight chord
  }, []);

  const playSuccess = useCallback(() => {
    // A pleasant 'chime' for success/capture
    playTone(523.25, 'sine', 0.2, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.3, 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.4, 0.1), 200); // G5
  }, []);

  const triggerHaptic = useCallback((type = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') {
        navigator.vibrate(10); // Very short, subtle tap
      } else if (type === 'heavy') {
        navigator.vibrate([20, 30, 20]); // Double tap
      } else if (type === 'success') {
        navigator.vibrate([20, 50, 20, 50, 40]); // Happy pattern
      }
    }
  }, []);

  const feedbackClick = useCallback(() => {
    playClick();
    triggerHaptic('light');
  }, [playClick, triggerHaptic]);

  const feedbackSuccess = useCallback(() => {
    playSuccess();
    triggerHaptic('success');
  }, [playSuccess, triggerHaptic]);

  return { playClick, playSuccess, triggerHaptic, feedbackClick, feedbackSuccess };
};
