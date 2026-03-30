let audioCtx: AudioContext | null = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
    try {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        // Ignore audio errors if context fails to start
    }
};

export const playClick = () => {
    try {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
};

export const playLogin = () => {
    setTimeout(() => playTone(523.25, 'sine', 0.5, 0.1), 0);   // C5
    setTimeout(() => playTone(659.25, 'sine', 0.5, 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.8, 0.1), 200); // G5
    setTimeout(() => playTone(1046.50, 'sine', 1.2, 0.15), 300); // C6
};

export const playLogout = () => {
    setTimeout(() => playTone(1046.50, 'sine', 0.3, 0.1), 0); // C6
    setTimeout(() => playTone(783.99, 'sine', 0.3, 0.1), 150); // G5
    setTimeout(() => playTone(659.25, 'sine', 0.4, 0.1), 300); // E5
    setTimeout(() => playTone(523.25, 'sine', 0.8, 0.1), 450); // C5
};

export const playNotification = () => {
    setTimeout(() => playTone(783.99, 'triangle', 0.4, 0.1), 0); // G5
    setTimeout(() => playTone(1046.50, 'triangle', 0.6, 0.1), 150); // C6
};

export const playError = () => {
    setTimeout(() => playTone(150, 'sawtooth', 0.3, 0.1), 0);
    setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.1), 150);
};

export const playTrash = () => {
    try {
        const ctx = initAudio();
        const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    } catch (e) {}
};
