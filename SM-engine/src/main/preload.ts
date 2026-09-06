import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  getMetadata: () => Promise<any>;
  parseCommand: (command: string) => Promise<any>;
  runScenario: () => Promise<void>;
  setCurrentBackground: (background: string) => Promise<void>;
  drawBackground: (background: string) => Promise<void>;
  drawCharacter: (characterName: string, sprite: string, position: number) => Promise<void>;
  showError: (error: string) => Promise<void>;
  showCharacter: (characterName: string, animation: number) => Promise<void>;
  hideCharacter: (characterName: string, animation: number) => Promise<void>;
  removeCharacter: (characterName: string, animation: number) => Promise<void>;
  showChoices: (question: string, choices: { text: string; line: number }[]) => Promise<void>;
  selectChoice: (choiceText: string, line: number) => Promise<void>;
  loadSceneImage: (name: string) => Promise<Buffer | null>;
  loadCharacterImage: (characterName: string, sprite: string) => Promise<Buffer | null>;
  onDrawBackground: (callback: (background: string) => void) => void;
  onDrawCharacter: (callback: (characterName: string, sprite: string, position: number) => void) => void;
  onShowError: (callback: (error: string) => void) => void;
  onInputRequired: (callback: () => void) => void;
  onWriteText: (callback: (character: string, text: string) => void) => void;
  onEndGame: (callback: () => void) => void;
  onShowCharacter: (callback: (characterName: string, animation: number) => void) => void;
  onChangeSprite: (callback: (characterName: string, sprite: string) => void) => void;
  onHideCharacter: (callback: (characterName: string, animation: number) => void) => void;
  onRemoveCharacter: (callback: (characterName: string, animation: number) => void) => void;
  onShowChoices: (callback: (question: string, choices: { text: string; line: number }[]) => void) => void;
  onPlaySound: (callback: (id: string, loop: boolean, volume?: number) => void) => void;
  onStopSound: (callback: (id: string) => void) => void;
  onPauseSound: (callback: (id: string) => void) => void;
  onResumeSound: (callback: (id: string) => void) => void;
  onStopAllSounds: (callback: () => void) => void;
  onSceneTransition: (callback: () => void) => void;
  resetGame: () => Promise<void>;
}

const electronAPI: ElectronAPI = {
  getMetadata: () => ipcRenderer.invoke('get-metadata'),
  parseCommand: (command: string) => ipcRenderer.invoke('parse-command', command),
  runScenario: () => ipcRenderer.invoke('run-scenario'),
  resetGame: () => ipcRenderer.invoke('reset-game'),
  setCurrentBackground: (background: string) => ipcRenderer.invoke('set-current-background', background),
  drawBackground: (background: string) => ipcRenderer.invoke('draw-background', background),
  drawCharacter: (characterName: string, sprite: string, position: number) => ipcRenderer.invoke('draw-character', characterName, sprite, position),
  showError: (error: string) => ipcRenderer.invoke('show-error', error),
  showCharacter: (characterName: string, animation: number) => ipcRenderer.invoke('show-character', characterName, animation),
  hideCharacter: (characterName: string, animation: number) => ipcRenderer.invoke('hide-character', characterName, animation),
  removeCharacter: (characterName: string, animation: number) => ipcRenderer.invoke('remove-character', characterName, animation),
  showChoices: (question: string, choices: { text: string; line: number }[]) => ipcRenderer.invoke('show-choices', question, choices),
  selectChoice: (choiceText: string, line: number) => ipcRenderer.invoke('select-choice', choiceText, line),
  loadSceneImage: (name: string) => ipcRenderer.invoke('load-scene-image', name),
  loadCharacterImage: (characterName: string, sprite: string) => ipcRenderer.invoke('load-character-image', characterName, sprite),
  onDrawBackground: (callback: (background: string) => void) => {
    ipcRenderer.on('draw-background', (_event, background) => callback(background));
  },
  onDrawCharacter: (callback: (characterName: string, sprite: string, position: number) => void) => {
    ipcRenderer.on('draw-character', (_event, characterName, sprite, position) => callback(characterName, sprite, position));
  },
  onShowError: (callback: (error: string) => void) => {
    ipcRenderer.on('show-error', (_event, error) => callback(error));
  },
  onInputRequired: (callback: () => void) => {
    ipcRenderer.on('input-required', () => callback());
  },
  onWriteText: (callback: (character: string, text: string) => void) => {
    ipcRenderer.on('write-text', (_event, character, text) => callback(character, text));
  },
  onEndGame: (callback: () => void) => {
    ipcRenderer.on('end-game', () => callback());
  },
  onShowCharacter: (callback: (characterName: string, animation: number) => void) => {
    ipcRenderer.on('show-character', (_event, characterName, animation) => callback(characterName, animation));
  },
  onChangeSprite: (callback: (characterName: string, sprite: string) => void) => {
    ipcRenderer.on('change-sprite', (_event, characterName, sprite) => callback(characterName, sprite));
  },
  onHideCharacter: (callback: (characterName: string, animation: number) => void) => {
    ipcRenderer.on('hide-character', (_event, characterName, animation) => callback(characterName, animation));
  },
  onRemoveCharacter: (callback: (characterName: string, animation: number) => void) => {
    ipcRenderer.on('remove-character', (_event, characterName, animation) => callback(characterName, animation));
  },
  onShowChoices: (callback: (question: string, choices: { text: string; line: number }[]) => void) => {
    ipcRenderer.on('show-choices', (_event, question, choices) => callback(question, choices));
  },
  onPlaySound: (callback: (id: string, loop: boolean, volume?: number) => void) => {
    ipcRenderer.on('play-sound', (_event, id, loop, volume) => callback(id, loop, volume));
  },
  onStopSound: (callback: (id: string) => void) => {
    ipcRenderer.on('stop-sound', (_event, id) => callback(id));
  },
  onPauseSound: (callback: (id: string) => void) => {
    ipcRenderer.on('pause-sound', (_event, id) => callback(id));
  },
  onResumeSound: (callback: (id: string) => void) => {
    ipcRenderer.on('resume-sound', (_event, id) => callback(id));
  },
  onStopAllSounds: (callback: () => void) => {
    ipcRenderer.on('stop-all-sounds', () => callback());
  },
  onSceneTransition: (callback: () => void) => {
    ipcRenderer.on('scene-transition', () => callback());
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
