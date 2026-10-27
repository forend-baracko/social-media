let SoundModule = null;
try {
    const imported = require('react-native-sound');
    SoundModule = imported.default || imported;
    if (SoundModule && typeof SoundModule.setCategory === 'function') {
        SoundModule.setCategory('Playback', true);
    }
} catch (e) {
    console.warn('react-native-sound module not available:', e);
}

class AudioPlaybackService {
    constructor() {
        this.sound = null;
        this.currentTrack = null;
        this.currentTrackId = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 230;
        this.listeners = new Set();
        this.progressInterval = null;
        this.loadRequestId = 0;
        this.onEndCallback = null;
    }

    addListener(callback) {
        this.listeners.add(callback);
        // Immediately notify new subscriber with current state
        if (this.currentTrack) {
            try {
                callback('status', {
                    isPlaying: this.isPlaying,
                    track: this.currentTrack,
                    currentTime: this.currentTime,
                    duration: this.duration,
                });
            } catch (err) {}
        }
        return () => this.listeners.delete(callback);
    }

    notify(event, data) {
        this.listeners.forEach((callback) => {
            try {
                callback(event, data);
            } catch (err) {
                console.warn('Playback listener error:', err);
            }
        });
    }

    getCurrentTrack() {
        return this.currentTrack;
    }

    getIsPlaying() {
        return this.isPlaying;
    }

    startProgressTimer() {
        this.stopProgressTimer();
        this.progressInterval = setInterval(() => {
            if (this.sound && this.isPlaying && typeof this.sound.getCurrentTime === 'function') {
                this.sound.getCurrentTime((seconds) => {
                    const secs = Math.floor(seconds);
                    this.currentTime = secs;
                    const dur = Math.floor(this.sound.getDuration() || this.duration);
                    if (dur > 0) this.duration = dur;
                    this.notify('progress', {
                        currentTime: secs,
                        duration: this.duration,
                    });
                });
            } else if (this.isPlaying) {
                // Fallback simulation timer if sound is simulated
                this.currentTime += 1;
                if (this.currentTime >= this.duration) {
                    this.currentTime = 0;
                    if (this.onEndCallback) this.onEndCallback();
                }
                this.notify('progress', {
                    currentTime: this.currentTime,
                    duration: this.duration,
                });
            }
        }, 1000);
    }

    stopProgressTimer() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    /**
     * Play a track safely without overlapping audio instances
     */
    async playTrack(track, onEndCallback) {
        if (!track) return;

        // If this exact track is already playing, do not recreate!
        if (this.sound && this.currentTrackId === track.id && this.isPlaying) {
            return;
        }

        // If this exact track is loaded but paused, simply resume
        if (this.sound && this.currentTrackId === track.id && !this.isPlaying) {
            this.resume();
            return;
        }

        // Increment request ID to cancel any pending async sound loads
        const currentRequestId = ++this.loadRequestId;

        // Clean up previous sound instance immediately
        this.stopProgressTimer();
        if (this.sound) {
            try {
                this.sound.stop();
                this.sound.release();
            } catch (e) {}
            this.sound = null;
        }

        this.currentTrack = track;
        this.currentTrackId = track.id;
        this.isPlaying = true;
        this.currentTime = 0;
        this.onEndCallback = onEndCallback;

        // Parse duration string like "4:17"
        let parsedDuration = 0;
        if (track.duration) {
            const parts = track.duration.split(':');
            if (parts.length === 2) {
                const mins = parseInt(parts[0], 10);
                const secs = parseInt(parts[1], 10);
                if (!isNaN(mins) && !isNaN(secs)) {
                    parsedDuration = mins * 60 + secs;
                }
            }
        }
        this.duration = parsedDuration > 0 ? parsedDuration : 230;

        // Notify UI immediately that new track is selected and playing
        this.notify('status', {
            isPlaying: true,
            track: this.currentTrack,
            currentTime: 0,
            duration: this.duration,
        });

        // Determine sound file and base path
        const audioSource = track.audioUrl || track.audioFile || '';
        let soundFilename = audioSource;
        let soundBasePath = '';

        if (typeof audioSource === 'string' && (audioSource.startsWith('http://') || audioSource.startsWith('https://'))) {
            soundFilename = audioSource;
            soundBasePath = '';
        } else if (
            track.id === 'track-1' ||
            (typeof audioSource === 'string' && audioSource.toLowerCase().includes('fallin'))
        ) {
            soundFilename = 'fallin.mp3';
            soundBasePath = SoundModule?.MAIN_BUNDLE ?? '';
        } else {
            soundFilename = 'fallin.mp3';
            soundBasePath = SoundModule?.MAIN_BUNDLE ?? '';
        }

        // Fallback simulation if SoundModule is not loaded
        if (typeof SoundModule !== 'function') {
            console.warn('Native SoundModule not available, simulating playback.');
            this.startProgressTimer();
            return;
        }

        try {
            const soundInstance = new SoundModule(soundFilename, soundBasePath, (error) => {
                // If a newer load request arrived while this was loading, discard this instance
                if (currentRequestId !== this.loadRequestId) {
                    try { soundInstance.release(); } catch (e) {}
                    return;
                }

                if (error) {
                    console.warn(`Failed to load audio for "${track.title}":`, error);
                    // Start simulated progress so user interface still reacts
                    this.startProgressTimer();
                    return;
                }

                this.sound = soundInstance;
                const actualDuration = Math.floor(soundInstance.getDuration() || 0);
                if (actualDuration > 0) {
                    this.duration = actualDuration;
                }

                soundInstance.setVolume(1.0);

                soundInstance.play((success) => {
                    if (currentRequestId !== this.loadRequestId) return;

                    this.isPlaying = false;
                    this.stopProgressTimer();
                    this.notify('status', { isPlaying: false, track: this.currentTrack });

                    // Only auto-advance if it successfully finished playing the song
                    if (success && this.onEndCallback) {
                        this.onEndCallback();
                    }
                });

                this.isPlaying = true;
                this.startProgressTimer();
                this.notify('status', {
                    isPlaying: true,
                    track: this.currentTrack,
                    duration: this.duration,
                });
            });
        } catch (err) {
            console.warn('Error instantiating Sound:', err);
            this.startProgressTimer();
        }
    }

    pause() {
        if (this.sound && this.isPlaying) {
            try {
                this.sound.pause();
            } catch (e) {}
        }
        this.isPlaying = false;
        this.stopProgressTimer();
        this.notify('status', { isPlaying: false, track: this.currentTrack });
    }

    resume() {
        if (!this.sound && this.currentTrack) {
            this.playTrack(this.currentTrack, this.onEndCallback);
            return;
        }

        if (this.sound && !this.isPlaying) {
            const currentReqId = this.loadRequestId;
            try {
                this.sound.play((success) => {
                    if (currentReqId !== this.loadRequestId) return;
                    this.isPlaying = false;
                    this.stopProgressTimer();
                    this.notify('status', { isPlaying: false, track: this.currentTrack });
                    if (success && this.onEndCallback) {
                        this.onEndCallback();
                    }
                });
            } catch (e) {}
        }
        this.isPlaying = true;
        this.startProgressTimer();
        this.notify('status', { isPlaying: true, track: this.currentTrack });
    }

    togglePlay(track) {
        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.sound) {
                this.resume();
            } else if (track || this.currentTrack) {
                this.playTrack(track || this.currentTrack, this.onEndCallback);
            }
        }
    }

    seekTo(seconds) {
        this.currentTime = seconds;
        if (this.sound && typeof this.sound.setCurrentTime === 'function') {
            try {
                this.sound.setCurrentTime(seconds);
            } catch (e) {}
        }
        this.notify('progress', {
            currentTime: this.currentTime,
            duration: this.duration,
        });
    }

    stop() {
        this.loadRequestId++;
        if (this.sound) {
            try {
                this.sound.stop();
                this.sound.release();
            } catch (e) {}
            this.sound = null;
        }
        this.isPlaying = false;
        this.stopProgressTimer();
        this.notify('status', { isPlaying: false, track: this.currentTrack });
    }
}

export const audioPlayer = new AudioPlaybackService();
export default audioPlayer;
