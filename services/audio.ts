
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple synthesizer to avoid loading external audio files
export const playSound = (type: 'pop' | 'success' | 'error' | 'levelup' | 'coin' | 'chest' | 'click' | 'kaching' | 'fanfare' | 'fail') => {
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
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

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
        // High pitched shiny sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'kaching':
        // Register sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.linearRampToValueAtTime(2000, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        // Second ching
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1500, now + 0.15);
        osc2.frequency.linearRampToValueAtTime(2500, now + 0.25);
        gain2.gain.setValueAtTime(0.1, now + 0.15);
        gain2.gain.linearRampToValueAtTime(0, now + 0.4);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.4);
        break;
  
      case 'error':
      case 'fail':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
  
      case 'levelup':
      case 'fanfare':
        osc.type = 'square';
        // Arpeggio
        const notes = [440, 554, 659, 880, 1108, 1318];
        notes.forEach((freq, i) => {
            const oscN = ctx.createOscillator();
            const gainN = ctx.createGain();
            oscN.type = 'triangle';
            oscN.frequency.value = freq;
            oscN.connect(gainN);
            gainN.connect(ctx.destination);
            
            const t = now + i * 0.08;
            gainN.gain.setValueAtTime(0.05, t);
            gainN.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            oscN.start(t);
            oscN.stop(t + 0.3);
        });
        break;

      case 'chest':
        // Low rumble then high sparkle
        const oscLow = ctx.createOscillator();
        const gainLow = ctx.createGain();
        oscLow.connect(gainLow);
        gainLow.connect(ctx.destination);
        oscLow.type = 'sawtooth';
        oscLow.frequency.setValueAtTime(100, now);
        oscLow.frequency.linearRampToValueAtTime(50, now + 0.5);
        gainLow.gain.setValueAtTime(0.1, now);
        gainLow.gain.linearRampToValueAtTime(0, now + 0.5);
        oscLow.start(now);
        oscLow.stop(now + 0.5);
        
        setTimeout(() => playSound('coin'), 400);
        break;
    }
  };
