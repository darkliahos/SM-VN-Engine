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
  showChoices: (choices: { text: string; line: number }[]) => Promise<void>;
  loadSceneImage: (name: string) => Promise<Buffer | null>;
  loadCharacterImage: (characterName: string, sprite: string) => Promise<Buffer | null>;
  onDrawBackground: (callback: (background: string) => void) => void;
  onDrawCharacter: (callback: (characterName: string, sprite: string, position: number) => void) => void;
  onShowError: (callback: (error: string) => void) => void;
  onInputRequired: (callback: () => void) => void;
  onWriteText: (callback: (character: string, text: string) => void) => void;
  onEndGame: (callback: () => void) => void;
  onShowCharacter: (callback: (characterName: string, animation: number) => void) => void;
  onHideCharacter: (callback: (characterName: string, animation: number) => void) => void;
  onRemoveCharacter: (callback: (characterName: string, animation: number) => void) => void;
  onShowChoices: (callback: (choices: { text: string; line: number }[]) => void) => void;
}

const electronAPI: ElectronAPI = {
  getMetadata: () => ipcRenderer.invoke('get-metadata'),
  parseCommand: (command: string) => ipcRenderer.invoke('parse-command', command),
  runScenario: () => ipcRenderer.invoke('run-scenario'),
  setCurrentBackground: (background: string) => ipcRenderer.invoke('set-current-background', background),
  drawBackground: (background: string) => ipcRenderer.invoke('draw-background', background),
  drawCharacter: (characterName: string, sprite: string, position: number) => ipcRenderer.invoke('draw-character', characterName, sprite, position),
  showError: (error: string) => ipcRenderer.invoke('show-error', error),
  showCharacter: (characterName: string, animation: number) => ipcRenderer.invoke('show-character', characterName, animation),
  hideCharacter: (characterName: string, animation: number) => ipcRenderer.invoke('hide-character', characterName, animation),
  removeCharacter: (characterName: string, animation: number) => ipcRenderer.invoke('remove-character', characterName, animation),
  showChoices: (choices: { text: string; line: number }[]) => ipcRenderer.invoke('show-choices', choices),
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
  onHideCharacter: (callback: (characterName: string, animation: number) => void) => {
    ipcRenderer.on('hide-character', (_event, characterName, animation) => callback(characterName, animation));
  },
  onRemoveCharacter: (callback: (characterName: string, animation: number) => void) => {
    ipcRenderer.on('remove-character', (_event, characterName, animation) => callback(characterName, animation));
  },
  onShowChoices: (callback: (choices: { text: string; line: number }[]) => void) => {
    ipcRenderer.on('show-choices', (_event, choices) => callback(choices));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
