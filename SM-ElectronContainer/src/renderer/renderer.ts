import * as PIXI from 'pixi.js';
import {Animation} from "../enums/Animation"
import {ElectronAPI} from "../main/preload"


declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export class PixiRenderer {
  private app: PIXI.Application | null = null;
  private backgrounds: Map<string, PIXI.Sprite> = new Map();
  private characters: Map<string, PIXI.Sprite> = new Map();
  private displayedCharacters: Map<string, PIXI.Sprite> = new Map();
  private currentBackground: PIXI.Sprite | null = null;
  private backgroundContainer: PIXI.Container | null = null;
  private characterContainer: PIXI.Container | null = null;
  private uiContainer: PIXI.Container | null = null;
  private textBox: PIXI.Container | null = null;
  private characterNameText: PIXI.Text | null = null;
  private dialogueText: PIXI.Text | null = null;
  private choicesContainer: PIXI.Container | null = null;
  private isReady: boolean = false;

  public async initialize(): Promise<void> {
    this.app = new PIXI.Application();

    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.id = 'game-canvas';
    document.getElementById('game-container')?.appendChild(canvas);

    this.backgroundContainer = new PIXI.Container();
    this.characterContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.characterContainer);
    this.app.stage.addChild(this.uiContainer);

    this.createTextBox();
    this.createChoicesContainer();
    this.setupEventListeners();
    this.setupIPCListeners();

    this.isReady = true;
  }

  private createTextBox(): void {
    this.textBox = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 700, 150, 10);
    bg.fill({ color: 0x000000, alpha: 0.85 });
    bg.stroke({ width: 2, color: 0xffffff });

    this.characterNameText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xffd700,
      }
    });
    this.characterNameText.x = 20;
    this.characterNameText.y = 15;

    this.dialogueText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 660,
        lineHeight: 30,
      }
    });
    this.dialogueText.x = 20;
    this.dialogueText.y = 50;

    this.textBox.addChild(bg);
    this.textBox.addChild(this.characterNameText);
    this.textBox.addChild(this.dialogueText);

    this.textBox.x = (window.innerWidth - 700) / 2;
    this.textBox.y = window.innerHeight - 180;
    this.textBox.visible = false;

    this.textBox.eventMode = 'static';
    this.textBox.cursor = 'pointer';
    this.textBox.on('pointerdown', () => this.advanceDialogue());

    this.uiContainer!.addChild(this.textBox);
  }

  private createChoicesContainer(): void {
    this.choicesContainer = new PIXI.Container();
    this.choicesContainer.visible = false;
    this.uiContainer!.addChild(this.choicesContainer);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.advanceDialogue();
      }
    });
  }

  private setupIPCListeners(): void {
    window.electronAPI.onDrawBackground((background: string) => {
      this.loadBackground(background);
    });

    window.electronAPI.onDrawCharacter((characterName: string, sprite: string) => {
      this.loadCharacter(characterName, sprite);
    });

    window.electronAPI.onWriteText((character: string, text: string) => {
      this.showTextBox(character, text);
    });

    window.electronAPI.onShowError((error: string) => {
      this.showError(error);
    });

    window.electronAPI.onEndGame(() => {
      this.showEndGame();
    });

    window.electronAPI.onInputRequired(() => {
      // Wait for user input
    });

    window.electronAPI.onShowCharacter((characterName: string, animation: number) => {
      this.showCharacter(characterName, animation as Animation);
    });

    window.electronAPI.onHideCharacter((characterName: string, animation: number) => {
      this.hideCharacter(characterName, animation as Animation);
    });

    window.electronAPI.onRemoveCharacter((characterName: string, animation: number) => {
      this.removeCharacter(characterName, animation as Animation);
    });

    window.electronAPI.onShowChoices((choices: { text: string; line: number }[]) => {
      this.showChoices(choices);
    });
  }

  private resize(): void {
    if (this.app) {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);

      if (this.textBox) {
        this.textBox.x = (window.innerWidth - 700) / 2;
        this.textBox.y = window.innerHeight - 180;
      }

      if (this.choicesContainer) {
        this.choicesContainer.x = window.innerWidth / 2;
        this.choicesContainer.y = window.innerHeight / 2;
      }
    }
  }

  public loadBackground(name: string, animation: Animation = Animation.FadeIn): void {
    if (this.backgrounds.has(name)) {
      const sprite = this.backgrounds.get(name)!;
      this.displayBackground(sprite, animation);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const texture = PIXI.Texture.from(img);
        const sprite = new PIXI.Sprite(texture);
        this.fitSpriteToScreen(sprite);
        this.backgrounds.set(name, sprite);
        this.displayBackground(sprite, animation);
      } catch (e) {
        console.error(`Failed to create texture for background: ${name}`, e);
      }
    };
    img.onerror = () => {
      console.error(`Failed to load background: ${name}`);
    };
    img.src = `../Scenes/${name}.png`;
  }

  private displayBackground(sprite: PIXI.Sprite, animation: Animation): void {
    if (this.currentBackground) {
      this.backgroundContainer!.removeChild(this.currentBackground);
    }

    sprite.alpha = 0;
    this.backgroundContainer!.addChild(sprite);
    this.currentBackground = sprite;

    switch (animation) {
      case Animation.FadeIn:
        this.fadeIn(sprite);
        break;
      case Animation.None:
      default:
        sprite.alpha = 1;
        break;
    }
  }

  public loadCharacter(name: string, spriteName: string): void {
    if (this.displayedCharacters.has(name)) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const texture = PIXI.Texture.from(img);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5, 1);
        sprite.x = window.innerWidth / 2;
        sprite.y = window.innerHeight - 50;
        sprite.scale.set(1);

        this.characters.set(name, sprite);
        this.displayedCharacters.set(name, sprite);
        this.characterContainer!.addChild(sprite);
      } catch (e) {
        console.error(`Failed to create texture for character: ${name}/${spriteName}`, e);
      }
    };
    img.onerror = () => {
      console.error(`Failed to load character: ${name}/${spriteName}`);
    };
    img.src = `../Characters/${name}/${spriteName}.png`;
  }

  public removeCharacter(name: string, animation: Animation = Animation.FadeOut): void {
    const sprite = this.displayedCharacters.get(name);
    if (!sprite) return;

    if (animation === Animation.FadeOut) {
      this.fadeOut(sprite, () => {
        this.characterContainer!.removeChild(sprite);
        this.displayedCharacters.delete(name);
      });
    } else {
      this.characterContainer!.removeChild(sprite);
      this.displayedCharacters.delete(name);
    }
  }

  public showCharacter(name: string, animation: Animation = Animation.FadeIn): void {
    const sprite = this.characters.get(name);
    if (!sprite) return;

    if (!this.displayedCharacters.has(name)) {
      sprite.alpha = 0;
      this.characterContainer!.addChild(sprite);
      this.displayedCharacters.set(name, sprite);
    }

    switch (animation) {
      case Animation.FadeIn:
        this.fadeIn(sprite);
        break;
      case Animation.SlideLeft:
        sprite.x = -sprite.width;
        this.slideIn(sprite, 'left');
        break;
      case Animation.SlideRight:
        sprite.x = window.innerWidth + sprite.width;
        this.slideIn(sprite, 'right');
        break;
      default:
        sprite.alpha = 1;
        break;
    }
  }

  public hideCharacter(name: string, animation: Animation = Animation.FadeOut): void {
    const sprite = this.displayedCharacters.get(name);
    if (!sprite) return;

    switch (animation) {
      case Animation.FadeOut:
        this.fadeOut(sprite, () => {
          this.characterContainer!.removeChild(sprite);
          this.displayedCharacters.delete(name);
        });
        break;
      default:
        this.characterContainer!.removeChild(sprite);
        this.displayedCharacters.delete(name);
        break;
    }
  }

  private fitSpriteToScreen(sprite: PIXI.Sprite): void {
    const scaleX = window.innerWidth / sprite.texture.width;
    const scaleY = window.innerHeight / sprite.texture.height;
    sprite.scale.set(Math.max(scaleX, scaleY));
    sprite.x = window.innerWidth / 2;
    sprite.y = window.innerHeight / 2;
    sprite.anchor.set(0.5);
  }

  private fadeIn(sprite: PIXI.Sprite, duration: number = 500): void {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      sprite.alpha = Math.min(elapsed / duration, 1);
      if (sprite.alpha < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private fadeOut(sprite: PIXI.Sprite, onComplete: () => void, duration: number = 500): void {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      sprite.alpha = 1 - Math.min(elapsed / duration, 1);
      if (sprite.alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    animate();
  }

  private slideIn(sprite: PIXI.Sprite, direction: string, duration: number = 500): void {
    const startTime = Date.now();
    const startX = sprite.x;
    const targetX = window.innerWidth / 2;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);

      sprite.x = startX + (targetX - startX) * eased;
      sprite.alpha = progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private showTextBox(character: string, text: string): void {
    if (this.characterNameText) {
      this.characterNameText.text = character || '';
    }
    if (this.dialogueText) {
      this.dialogueText.text = text;
    }
    if (this.textBox) {
      this.textBox.visible = true;
    }
  }

  private advanceDialogue(): void {
    if (this.textBox && this.textBox.visible) {
      this.textBox.visible = false;
    }
    window.electronAPI.runScenario();
  }

  public showChoices(choices: { text: string; line: number }[]): void {
    if (!this.choicesContainer) return;

    this.choicesContainer.removeChildren();

    const title = new PIXI.Text({
      text: 'Choose:',
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' }
    });
    title.x = -75;
    title.y = -((choices.length * 50) / 2) - 30;
    this.choicesContainer.addChild(title);

    choices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice.text, index);
      button.y = index * 50;
      this.choicesContainer!.addChild(button);
    });

    this.choicesContainer.visible = true;
    this.choicesContainer.x = window.innerWidth / 2;
    this.choicesContainer.y = window.innerHeight / 2;
  }

  private createChoiceButton(text: string, index: number): PIXI.Container {
    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 200, 40, 5);
    bg.fill({ color: 0x333333, alpha: 0.9 });
    bg.stroke({ width: 2, color: 0xffffff });

    const label = new PIXI.Text({ text, style: { fontSize: 18, fill: 0xffffff } });
    label.x = 100;
    label.y = 10;
    label.anchor.set(0.5, 0);

    container.addChild(bg);
    container.addChild(label);

    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, 200, 40, 5);
      bg.fill({ color: 0xffd700, alpha: 0.9 });
      bg.stroke({ width: 2, color: 0xffd700 });
      label.style.fill = 0x000000;
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, 200, 40, 5);
      bg.fill({ color: 0x333333, alpha: 0.9 });
      bg.stroke({ width: 2, color: 0xffffff });
      label.style.fill = 0xffffff;
    });

    return container;
  }

  private showError(message: string): void {
    const container = new PIXI.Container();
    const overlay = new PIXI.Graphics();
    overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    overlay.fill({ color: 0xff0000, alpha: 0.3 });

    const errorBox = new PIXI.Graphics();
    errorBox.roundRect(0, 0, 400, 150, 10);
    errorBox.fill(0xffffff);
    errorBox.x = window.innerWidth / 2 - 200;
    errorBox.y = window.innerHeight / 2 - 75;

    const errorText = new PIXI.Text({
      text: message,
      style: { fontSize: 16, fill: 0xcc0000, wordWrap: true, wordWrapWidth: 360 }
    });
    errorText.x = window.innerWidth / 2 - 180;
    errorText.y = window.innerHeight / 2 - 50;

    container.addChild(overlay);
    container.addChild(errorBox);
    container.addChild(errorText);

    this.uiContainer!.addChild(container);
  }

  private showEndGame(): void {
    this.backgroundContainer!.removeChildren();
    this.characterContainer!.removeChildren();

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill(0x000000);

    const endText = new PIXI.Text({
      text: 'The End',
      style: { fontSize: 64, fill: 0xffffff, fontWeight: 'bold' }
    });
    endText.anchor.set(0.5);
    endText.x = window.innerWidth / 2;
    endText.y = window.innerHeight / 2;

    this.backgroundContainer!.addChild(bg);
    this.backgroundContainer!.addChild(endText);
  }

  public isInitialized(): boolean {
    return this.isReady;
  }
}
