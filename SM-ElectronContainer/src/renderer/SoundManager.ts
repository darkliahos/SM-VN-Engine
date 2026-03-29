import { SoundEngine, SoundId } from './SoundEngine';

export class SoundManager {
  private soundEngine: SoundEngine;
  private audioBasePath: string = '../Audio';

  constructor(soundEngine?: SoundEngine) {
    this.soundEngine = soundEngine || new SoundEngine();
    this.setupIPCListeners();
  }

  private setupIPCListeners(): void {
    window.electronAPI.onPlaySound((id: string, loop: boolean, volume?: number) => {
      this.playSound(id, loop, volume);
    });

    window.electronAPI.onStopSound((id: string) => {
      this.stopSound(id);
    });

    window.electronAPI.onPauseSound((id: string) => {
      this.pauseSound(id);
    });

    window.electronAPI.onResumeSound((id: string) => {
      this.resumeSound(id);
    });

    window.electronAPI.onStopAllSounds(() => {
      this.stopAll();
    });
  }

  public async loadSound(id: SoundId, fileName: string, loop = false, volume = 0.5): Promise<boolean> {
    const success = await this.soundEngine.load(id, this.audioBasePath, fileName, { loop, volume });
    if (success) {
      console.log(`Sound loaded: ${id} (${fileName})`);
    } else {
      console.error(`Failed to load sound: ${id} (${fileName})`);
    }
    return success;
  }

  public async playSound(id: SoundId, loop = false, volume = 0.5): Promise<boolean> {
    if (!this.soundEngine.has(id)) {
      console.log(`Sound ${id} not loaded, loading now...`);
      const success = await this.loadSound(id, id, loop, volume);
      if (!success) {
        console.error(`Failed to load sound: ${id}`);
        return false;
      }
    } else {
      this.soundEngine.setVolume(id, volume);
    }
    return this.soundEngine.play(id);
  }

  public stopSound(id: SoundId): boolean {
    return this.soundEngine.stop(id);
  }

  public pauseSound(id: SoundId): boolean {
    return this.soundEngine.pause(id);
  }

  public resumeSound(id: SoundId): boolean {
    return this.soundEngine.resume(id);
  }

  public stopAll(): void {
    this.soundEngine.stopAll();
  }
}

export const soundManager = new SoundManager();
