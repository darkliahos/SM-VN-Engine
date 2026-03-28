export const RegexConstants = {
  CharacterNameRegex: /\[(.*?)\]/,
  GetStuffInQuotes: /"(.*?)"/,
  GetPixelValue: /[0-9]*\.?[0-9]+(px|%)?/,
  GetRoundBracketNumbers: /([0-9\.]+)/g,
  GetStuffInAstrix: /\*(.*?)\*/,
  GetSprite: /\](.*?)\*/,
  GetPosition: /\((left|right|centre|center)\)/i,
};
