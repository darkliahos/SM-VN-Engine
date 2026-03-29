import * as PIXI from 'pixi.js';
import {Animation} from "../enums/Animation"
import {Position} from "../enums/Position"
import {ElectronAPI} from "../main/preload"
import { GameConfig } from "./GameConfig"


declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export class PixiRenderer {
  private app: PIXI.Application | null = null;
  private backgrounds: Map<string, PIXI.Sprite> = new Map();
  private characterSprites: Map<string, PIXI.Sprite> = new Map();
  private characterTextures: Map<string, PIXI.Texture> = new Map();
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
  private gameTitle: string = 'Visual Novel';
  private onStartCallback: (() => void) | null = null;

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
    const { textBox: tb, fonts, colors, dialogue: dl } = GameConfig.UI;
    this.textBox = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, tb.width, tb.height, tb.borderRadius);
    bg.fill({ color: tb.backgroundColor, alpha: tb.backgroundAlpha });
    bg.stroke({ width: tb.borderWidth, color: tb.borderColor });

    this.characterNameText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: fonts.family,
        fontSize: fonts.characterNameSize,
        fontWeight: 'bold',
        fill: colors.characterName,
      }
    });
    this.characterNameText.x = dl.nameOffsetX;
    this.characterNameText.y = dl.nameOffsetY;

    this.dialogueText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: fonts.family,
        fontSize: fonts.dialogueSize,
        fill: colors.dialogue,
        wordWrap: true,
        wordWrapWidth: dl.wordWrapWidth,
        lineHeight: dl.lineHeight,
      }
    });
    this.dialogueText.x = dl.textOffsetX;
    this.dialogueText.y = dl.textOffsetY;

    this.textBox.addChild(bg);
    this.textBox.addChild(this.characterNameText);
    this.textBox.addChild(this.dialogueText);

    this.textBox.x = (window.innerWidth - tb.width) / 2;
    this.textBox.y = window.innerHeight - tb.xOffset;
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

    window.electronAPI.onDrawCharacter((characterName: string, sprite: string, position: number) => {
      this.loadCharacter(characterName, sprite, Animation.FadeIn, position);
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

    window.electronAPI.onChangeSprite((characterName: string, spriteName: string) => {
      this.changeCharacterSprite(characterName, spriteName);
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
        this.textBox.x = (window.innerWidth - GameConfig.UI.textBox.width) / 2;
        this.textBox.y = window.innerHeight - GameConfig.UI.textBox.xOffset;
      }

      if (this.choicesContainer) {
        this.choicesContainer.x = window.innerWidth / 2;
        this.choicesContainer.y = window.innerHeight / 2;
      }

      this.repositionCharacters();
    }
  }

  private repositionCharacters(): void {
    this.characterSprites.forEach((sprite) => {
      const screenPosition = (sprite as any).screenPosition ?? 1;
      this.positionSprite(sprite, screenPosition, false);
    });
  }

  private positionSprite(sprite: PIXI.Sprite, screenPosition: number, setY: boolean = true): void {
    const { targetHeightRatio, leftPositionRatio, rightPositionRatio } = GameConfig.Character;
    const targetHeight = window.innerHeight * targetHeightRatio;
    const scale = targetHeight / sprite.texture.height;
    sprite.scale.set(scale);

    const spriteWidth = sprite.texture.width * scale;

    if (screenPosition === Position.Left) {
      sprite.x = window.innerWidth * leftPositionRatio;
    } else if (screenPosition === Position.Right) {
      sprite.x = window.innerWidth * rightPositionRatio - spriteWidth;
    } else {
      sprite.x = (window.innerWidth - spriteWidth) / 2;
    }

    if (setY) {
      sprite.y = window.innerHeight;
    }
  }

  public loadBackground(name: string, animation: Animation = Animation.FadeIn): void {
    if (this.backgrounds.has(name)) {
      const sprite = this.backgrounds.get(name)!;
      this.displayBackground(sprite, animation);
      return;
    }

    const loadImage = (extensions: string[]) => {
      if (extensions.length === 0) {
        console.error(`Failed to load background: ${name} (tried .png, .jpg, .jpeg)`);
        return;
      }

      const ext = extensions[0];
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
        loadImage(extensions.slice(1));
      };
      img.src = `../Scenes/${name}.${ext}`;
    };

    loadImage(['png', 'jpg', 'jpeg']);
  }

  private displayBackground(sprite: PIXI.Sprite, animation: Animation): void {
    if (this.currentBackground === sprite) {
      return;
    }

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

  public loadCharacter(name: string, spriteName: string, animation: Animation = Animation.FadeIn, screenPosition: number = 1): void {
    if (this.displayedCharacters.has(name)) {
      return;
    }

    const textureKey = `${name}/${spriteName}`;
    
    if (this.characterTextures.has(textureKey)) {
      this.createCharacterSpriteFromTexture(name, textureKey, animation, screenPosition);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const texture = PIXI.Texture.from(img);
        this.characterTextures.set(textureKey, texture);
        this.createCharacterSpriteFromTexture(name, textureKey, animation, screenPosition);
      } catch (e) {
        console.error(`Failed to create texture for character: ${name}/${spriteName}`, e);
      }
    };
    img.onerror = () => {
      console.error(`Character sprite not found: ../Characters/${name}/${spriteName}.png`);
      window.electronAPI.showError(`Character sprite not found: ${name}/${spriteName}`);
    };
    img.src = `../Characters/${name}/${spriteName}.png`;
  }

  private createCharacterSpriteFromTexture(name: string, textureKey: string, animation: Animation, screenPosition: number): void {
    const texture = this.characterTextures.get(textureKey)!;
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0, GameConfig.Character.anchorY);
    (sprite as any).screenPosition = screenPosition;
    (sprite as any).textureKey = textureKey;

    this.positionSprite(sprite, screenPosition, true);

    this.characterSprites.set(name, sprite);
    this.showCharacter(name, animation);
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
    const sprite = this.characterSprites.get(name);
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

  public changeCharacterSprite(name: string, spriteName: string): void {
    const sprite = this.characterSprites.get(name);
    if (!sprite) return;

    const textureKey = `${name}/${spriteName}`;
    
    if (this.characterTextures.has(textureKey)) {
      sprite.texture = this.characterTextures.get(textureKey)!;
      this.updateSpriteScaleAndPosition(sprite);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const texture = PIXI.Texture.from(img);
        this.characterTextures.set(textureKey, texture);
        sprite.texture = texture;
        (sprite as any).textureKey = textureKey;
        this.updateSpriteScaleAndPosition(sprite);
      } catch (e) {
        console.error(`Failed to change sprite for ${name}/${spriteName}`, e);
      }
    };
    img.onerror = () => {
      console.error(`Sprite not found: ../Characters/${name}/${spriteName}.png`);
      window.electronAPI.showError(`Sprite not found: ${name}/${spriteName}`);
    };
    img.src = `../Characters/${name}/${spriteName}.png`;
  }

  private updateSpriteScaleAndPosition(sprite: PIXI.Sprite): void {
    const screenPosition = (sprite as any).screenPosition ?? 1;
    this.positionSprite(sprite, screenPosition, false);
  }

  private fitSpriteToScreen(sprite: PIXI.Sprite): void {
    const scaleX = window.innerWidth / sprite.texture.width;
    const scaleY = window.innerHeight / sprite.texture.height;
    sprite.scale.set(Math.max(scaleX, scaleY));
    sprite.x = window.innerWidth / 2;
    sprite.y = window.innerHeight / 2;
    sprite.anchor.set(0.5);
  }

  private fadeIn(sprite: PIXI.Sprite, duration?: number): void {
    if (!this.app) return;
    
    const ticker = this.app.ticker;
    const startTime = ticker.lastTime;
    const durationMs = duration ?? GameConfig.Animation.defaultDuration;
    
    const fadeTicker = (t: PIXI.Ticker) => {
      const elapsed = t.lastTime - startTime;
      sprite.alpha = Math.min(elapsed / durationMs, 1);
      if (sprite.alpha >= 1) {
        ticker.remove(fadeTicker);
      }
    };
    ticker.add(fadeTicker);
  }

  private fadeOut(sprite: PIXI.Sprite, onComplete: () => void, duration?: number): void {
    if (!this.app) {
      onComplete();
      return;
    }
    
    const ticker = this.app.ticker;
    const startTime = ticker.lastTime;
    const durationMs = duration ?? GameConfig.Animation.defaultDuration;
    
    const fadeTicker = (t: PIXI.Ticker) => {
      const elapsed = t.lastTime - startTime;
      sprite.alpha = 1 - Math.min(elapsed / durationMs, 1);
      if (sprite.alpha <= 0) {
        ticker.remove(fadeTicker);
        onComplete();
      }
    };
    ticker.add(fadeTicker);
  }

  private slideIn(sprite: PIXI.Sprite, direction: string, duration?: number): void {
    if (!this.app) return;
    
    const ticker = this.app.ticker;
    const startTime = ticker.lastTime;
    const startX = sprite.x;
    const targetX = window.innerWidth / 2;
    const durationMs = duration ?? GameConfig.Animation.defaultDuration;

    const slideTicker = (t: PIXI.Ticker) => {
      const elapsed = t.lastTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = this.easeOutCubic(progress);

      sprite.x = startX + (targetX - startX) * eased;
      sprite.alpha = progress;

      if (progress >= 1) {
        ticker.remove(slideTicker);
      }
    };
    ticker.add(slideTicker);
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
    const { fonts, colors, choiceButton: cb } = GameConfig.UI;

    this.choicesContainer.removeChildren();

    const title = new PIXI.Text({
      text: 'Choose:',
      style: { fontSize: fonts.characterNameSize, fill: colors.dialogue, fontWeight: 'bold' }
    });
    title.x = -75;
    title.y = -((choices.length * cb.spacing) / 2) - 30;
    this.choicesContainer.addChild(title);

    choices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice.text, index);
      button.y = index * cb.spacing;
      this.choicesContainer!.addChild(button);
    });

    this.choicesContainer.visible = true;
    this.choicesContainer.x = window.innerWidth / 2;
    this.choicesContainer.y = window.innerHeight / 2;
  }

  private createChoiceButton(text: string, index: number): PIXI.Container {
    const { fonts, colors, choiceButton: cb } = GameConfig.UI;
    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, cb.width, cb.height, cb.borderRadius);
    bg.fill({ color: colors.choiceBg, alpha: cb.alpha });
    bg.stroke({ width: GameConfig.UI.textBox.borderWidth, color: GameConfig.UI.textBox.borderColor });

    const label = new PIXI.Text({ text, style: { fontSize: fonts.choiceButtonSize, fill: colors.dialogue } });
    label.x = cb.width / 2;
    label.y = 10;
    label.anchor.set(0.5, 0);

    container.addChild(bg);
    container.addChild(label);

    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, cb.width, cb.height, cb.borderRadius);
      bg.fill({ color: colors.choiceBgHover, alpha: cb.alpha });
      bg.stroke({ width: GameConfig.UI.textBox.borderWidth, color: colors.buttonHoverBorder });
      label.style.fill = colors.choiceTextHover;
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, cb.width, cb.height, cb.borderRadius);
      bg.fill({ color: colors.choiceBg, alpha: cb.alpha });
      bg.stroke({ width: GameConfig.UI.textBox.borderWidth, color: GameConfig.UI.textBox.borderColor });
      label.style.fill = colors.dialogue;
    });

    return container;
  }

  private showError(message: string): void {
    const { colors, fonts } = GameConfig.UI;
    const container = new PIXI.Container();
    const overlay = new PIXI.Graphics();
    overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    overlay.fill({ color: colors.overlay, alpha: 0.3 });

    const errorBox = new PIXI.Graphics();
    errorBox.roundRect(0, 0, 400, 150, GameConfig.UI.textBox.borderRadius);
    errorBox.fill(colors.errorBg);
    errorBox.x = window.innerWidth / 2 - 200;
    errorBox.y = window.innerHeight / 2 - 75;

    const errorText = new PIXI.Text({
      text: message,
      style: { fontSize: fonts.dialogueSize - 4, fill: colors.errorText, wordWrap: true, wordWrapWidth: 360 }
    });
    errorText.x = window.innerWidth / 2 - 180;
    errorText.y = window.innerHeight / 2 - 50;

    container.addChild(overlay);
    container.addChild(errorBox);
    container.addChild(errorText);

    this.uiContainer!.addChild(container);
  }

  public showTitleScreen(title: string, onStart: () => void): void {
    const { fonts, colors, textBox: tb } = GameConfig.UI;
    this.gameTitle = title;
    this.onStartCallback = onStart;
    this.cleanupScene();
    this.destroyTextures();
    this.textBox!.visible = false;

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill(0x000000);
    this.backgroundContainer!.addChild(bg);

    const titleText = new PIXI.Text({
      text: title,
      style: {
        fontSize: fonts.titleSize,
        fill: GameConfig.Title.color,
        fontWeight: 'bold',
        fontFamily: GameConfig.Title.fontFamily
      }
    });
    titleText.anchor.set(0.5);
    titleText.x = window.innerWidth / 2;
    titleText.y = window.innerHeight / 2 - 60;
    this.backgroundContainer!.addChild(titleText);

    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonContainer = new PIXI.Container();
    const buttonBg = new PIXI.Graphics();
    buttonBg.roundRect(0, 0, buttonWidth, buttonHeight, tb.borderRadius);
    buttonBg.fill({ color: colors.buttonBg });
    buttonBg.stroke({ width: tb.borderWidth, color: colors.dialogue });

    const buttonText = new PIXI.Text({
      text: 'Start',
      style: {
        fontSize: fonts.buttonTextSize,
        fill: colors.buttonText,
        fontWeight: 'bold'
      }
    });
    buttonText.anchor.set(0.5);
    buttonText.x = buttonWidth / 2;
    buttonText.y = 30;

    buttonContainer.addChild(buttonBg);
    buttonContainer.addChild(buttonText);
    buttonContainer.x = window.innerWidth / 2 - buttonWidth / 2;
    buttonContainer.y = window.innerHeight / 2 + 40;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    buttonContainer.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.roundRect(0, 0, buttonWidth, buttonHeight, tb.borderRadius);
      buttonBg.fill({ color: colors.buttonHoverBg });
      buttonBg.stroke({ width: tb.borderWidth, color: colors.buttonHoverBorder });
      buttonText.style.fill = colors.buttonText;
    });

    buttonContainer.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.roundRect(0, 0, buttonWidth, buttonHeight, tb.borderRadius);
      buttonBg.fill({ color: colors.buttonBg });
      buttonBg.stroke({ width: tb.borderWidth, color: colors.dialogue });
      buttonText.style.fill = colors.buttonText;
    });

    buttonContainer.on('pointerdown', () => {
      this.backgroundContainer!.removeChildren();
      onStart();
    });

    this.backgroundContainer!.addChild(buttonContainer);
  }

  private showEndGame(): void {
    const { fonts, colors, textBox: tb } = GameConfig.UI;
    const savedTitle = this.gameTitle;
    const savedCallback = this.onStartCallback;

    this.cleanupScene();
    this.textBox!.visible = false;

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill(0x000000);

    const endText = new PIXI.Text({
      text: 'The End',
      style: { fontSize: fonts.titleSize - 8, fill: colors.dialogue, fontWeight: 'bold' }
    });
    endText.anchor.set(0.5);
    endText.x = window.innerWidth / 2;
    endText.y = window.innerHeight / 2 - 60;

    this.backgroundContainer!.addChild(bg);
    this.backgroundContainer!.addChild(endText);

    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonContainer = new PIXI.Container();
    const buttonBg = new PIXI.Graphics();
    buttonBg.roundRect(-50, 0, buttonWidth, buttonHeight, tb.borderRadius);
    buttonBg.fill({ color: colors.buttonBg });
    buttonBg.stroke({ width: tb.borderWidth, color: colors.dialogue });

    const buttonText = new PIXI.Text({
      text: 'Back to title screen',
      style: {
        fontSize: fonts.buttonTextSize,
        fill: colors.buttonText,
        fontWeight: 'bold'
      }
    });
    buttonText.anchor.set(0.5);
    buttonText.x = 50;
    buttonText.y = 30;

    buttonContainer.addChild(buttonBg);
    buttonContainer.addChild(buttonText);
    buttonContainer.x = window.innerWidth / 2 - 20;
    buttonContainer.y = window.innerHeight / 2 + 40;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    buttonContainer.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.roundRect(30, 0, buttonWidth, buttonHeight, tb.borderRadius);
      buttonBg.fill({ color: colors.buttonHoverBg });
      buttonBg.stroke({ width: tb.borderWidth, color: colors.buttonHoverBorder });
    });

    buttonContainer.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.roundRect(0, 0, buttonWidth, buttonHeight, tb.borderRadius);
      buttonBg.fill({ color: colors.buttonBg });
      buttonBg.stroke({ width: tb.borderWidth, color: colors.dialogue });
    });

    buttonContainer.on('pointerdown', () => {
      this.showTitleScreen(savedTitle, savedCallback!);
    });

    this.backgroundContainer!.addChild(buttonContainer);
  }

  public isInitialized(): boolean {
    return this.isReady;
  }

  private cleanupScene(): void {
    this.backgroundContainer!.removeChildren();
    this.characterContainer!.removeChildren();
    this.choicesContainer!.removeChildren();
    this.displayedCharacters.clear();
    this.characterSprites.clear();
  }

  public destroyTextures(): void {
    this.backgrounds.forEach(sprite => sprite.destroy({ children: true, texture: true }));
    this.backgrounds.clear();
    this.characterTextures.forEach(texture => texture.destroy(true));
    this.characterTextures.clear();
  }
}
