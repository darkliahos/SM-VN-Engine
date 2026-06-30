export const GameConfig = {
  UI: {
    textBox: {
      width: 700,
      height: 150,
      xOffset: 180,
      backgroundColor: 0x000000,
      backgroundAlpha: 0.85,
      borderWidth: 2,
      borderColor: 0xffffff,
      borderRadius: 10,
    },
    fonts: {
      family: 'Arial, sans-serif',
      characterNameSize: 24,
      dialogueSize: 20,
      choiceButtonSize: 18,
      titleSize: 72,
      buttonSize: 28,
      buttonTextSize: 28,
    },
    colors: {
      characterName: 0xffd700,
      dialogue: 0xffffff,
      buttonBg: 0xffd700,
      buttonText: 0x000000,
      buttonHoverBg: 0xffffff,
      buttonHoverBorder: 0xffd700,
      choiceBg: 0x333333,
      choiceBgHover: 0xffd700,
      choiceTextHover: 0x000000,
      errorBg: 0xffffff,
      errorText: 0xcc0000,
      overlay: 0xff0000,
    },
    dialogue: {
      wordWrapWidth: 660,
      lineHeight: 30,
      nameOffsetX: 20,
      nameOffsetY: 15,
      textOffsetX: 20,
      textOffsetY: 50,
    },
    choiceButton: {
      width: 200,
      height: 40,
      spacing: 50,
      borderRadius: 5,
      alpha: 0.9,
    },
  },
  Character: {
    targetHeightRatio: 0.8,
    leftPositionRatio: 0.1,
    rightPositionRatio: 0.9,
    anchorY: 1,
  },
  Animation: {
    defaultDuration: 500,
  },
  Title: {
    fontFamily: 'Georgia, serif',
    color: 0xffd700,
  },
} as const;

export type GameConfig = typeof GameConfig;
