import { Howl, Howler } from 'howler';

export type SoundId = string;

export interface SoundOptions {
  loop?: boolean;
  volume?: number;
  playbackRate?: number;
}

const DEFAULT_FORMATS = [
  { extension: '.mp3', mimeType: 'audio/mpeg' },
  { extension: '.wav', mimeType: 'audio/wav' },
  { extension: '.ogg', mimeType: 'audio/ogg' },
];

export class SoundEngine {
  private sounds: Map<SoundId, Howl> = new Map();

  constructor() {
    Howler.autoUnlock = true;
  }

  public load(
    id: SoundId,
    basePath: string,
    fileName: string,
    options: SoundOptions = {}
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.sounds.has(id)) {
        resolve(true);
        return;
      }

      const nameWithoutExt = this.stripExtension(fileName);
      const sources = DEFAULT_FORMATS.map(format => {
        const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
        return `${normalizedBase}${nameWithoutExt}${format.extension}`;
      });

      const howl = new Howl({
        src: sources,
        loop: options.loop ?? false,
        volume: options.volume ?? 0.5,
        html5: true,
        preload: true,
        onload: () => {
          console.log(`Sound ${id} loaded successfully`);
          resolve(true);
        },
        onloaderror: (_soundId: number, error: unknown) => {
          console.error(`Failed to load sound ${id}:`, error);
          resolve(false);
        },
        onplayerror: (_soundId: number, error: unknown) => {
          console.error(`Failed to play sound ${id}:`, error);
          howl.once('unlock', () => howl.play());
        },
      });

      this.sounds.set(id, howl);
    });
  }

  private stripExtension(fileName: string): string {
    for (const format of DEFAULT_FORMATS) {
      if (fileName.toLowerCase().endsWith(format.extension.toLowerCase())) {
        return fileName.slice(0, -format.extension.length);
      }
    }
    return fileName;
  }

  public play(id: SoundId): boolean {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound ${id} not found`);
      return false;
    }
    sound.play();
    return true;
  }

  public stop(id: SoundId): boolean {
    const sound = this.sounds.get(id);
    if (!sound) {
      return false;
    }
    sound.stop();
    return true;
  }

  public pause(id: SoundId): boolean {
    const sound = this.sounds.get(id);
    if (!sound) {
      return false;
    }
    sound.pause();
    return true;
  }

  public resume(id: SoundId): boolean {
    const sound = this.sounds.get(id);
    if (!sound) {
      return false;
    }
    sound.play();
    return true;
  }

  public setVolume(id: SoundId, volume: number): boolean {
    const sound = this.sounds.get(id);
    if (!sound) {
      return false;
    }
    sound.volume(Math.max(0, Math.min(1, volume)));
    return true;
  }

  public stopAll(): void {
    Howler.stop();
  }

  public has(id: SoundId): boolean {
    return this.sounds.has(id);
  }
}
