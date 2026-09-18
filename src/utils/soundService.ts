/**
 * Sound notification service for kitchen operations
 * Uses Web Audio API for reliable sound playback
 */

class SoundService {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private volume: number = 0.7;
  private muted: boolean = false;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API not supported:', error);
    }
  }

  /**
   * Generate a beep sound programmatically
   */
  private async generateBeep(frequency: number = 800, duration: number = 0.2): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Generate sine wave with envelope
      const envelope = Math.min(1, (numSamples - i) / (sampleRate * 0.05));
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Play a sound by name
   */
  async play(soundName: 'new_order' | 'order_ready' | 'order_cancelled' | 'notification') {
    if (this.muted || !this.audioContext) {
      return;
    }

    try {
      // Resume audio context if suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      let buffer = this.sounds.get(soundName);

      // Generate sound if not cached
      if (!buffer) {
        const frequencies: Record<string, number> = {
          new_order: 880, // A5 - high pitch for attention
          order_ready: 660, // E5 - medium pitch
          order_cancelled: 440, // A4 - lower pitch
          notification: 550, // C5 - neutral pitch
        };

        const durations: Record<string, number> = {
          new_order: 0.3,
          order_ready: 0.2,
          order_cancelled: 0.4,
          notification: 0.15,
        };

        buffer = await this.generateBeep(
          frequencies[soundName],
          durations[soundName]
        );
        this.sounds.set(soundName, buffer);
      }

      // Play the sound
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Play new order notification (double beep)
   */
  async playNewOrder() {
    await this.play('new_order');
    setTimeout(() => this.play('new_order'), 300);
  }

  /**
   * Play order ready notification
   */
  async playOrderReady() {
    await this.play('order_ready');
  }

  /**
   * Play order cancelled notification
   */
  async playOrderCancelled() {
    await this.play('order_cancelled');
  }

  /**
   * Set volume (0 to 1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Mute/unmute sounds
   */
  setMuted(muted: boolean) {
    this.muted = muted;
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Test sound playback (call on user interaction)
   */
  async testSound() {
    await this.play('notification');
  }
}

// Export singleton instance
export const soundService = new SoundService();
