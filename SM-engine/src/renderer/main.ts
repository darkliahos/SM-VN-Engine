import { PixiRenderer } from './renderer';
import { soundManager } from './SoundManager';

const renderer = new PixiRenderer();

async function main() {
  await renderer.initialize();
  setupSoundListeners();
  const metadata = await window.electronAPI.getMetadata();
  renderer.showTitleScreen(metadata.Title || 'Visual Novel', async () => {
    await window.electronAPI.resetGame();
    window.electronAPI.runScenario();
  });
}

function setupSoundListeners(): void {
  window.electronAPI.onPlaySound((id: string, loop: boolean, volume?: number) => {
    soundManager.playSound(id, loop, volume);
  });

  window.electronAPI.onStopSound((id: string) => {
    soundManager.stopSound(id);
  });

  window.electronAPI.onPauseSound((id: string) => {
    soundManager.pauseSound(id);
  });

  window.electronAPI.onResumeSound((id: string) => {
    soundManager.resumeSound(id);
  });

  window.electronAPI.onStopAllSounds(() => {
    soundManager.stopAll();
  });
}

document.addEventListener('DOMContentLoaded', main);
