/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple synthesizer to avoid loading external audio files
export const playSound = (type: 'pop' | 'success' | 'error' | 'levelup' | 'coin') => {
    // Check for browser support
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
  
    const now = ctx.currentTime;
  
    switch (type) {
      case 'pop':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      
      case 'success':
        // Bright high ping
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        osc.frequency.setValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
  
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
  
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
  
      case 'levelup':
        osc.type = 'square';
        // Arpeggio
        const notes = [440, 554, 659, 880, 1108];
        notes.forEach((freq, i) => {
            const oscN = ctx.createOscillator();
            const gainN = ctx.createGain();
            oscN.type = 'triangle';
            oscN.frequency.value = freq;
            oscN.connect(gainN);
            gainN.connect(ctx.destination);
            
            const t = now + i * 0.1;
            gainN.gain.setValueAtTime(0.05, t);
            gainN.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            oscN.start(t);
            oscN.stop(t + 0.3);
        });
        break;
    }
  };