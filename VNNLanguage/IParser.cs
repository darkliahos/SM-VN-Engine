using System;
using System.Collections.Generic;
using System.Linq;
using VNNLanguage.Constants;
using VNNLanguage.Exceptions;
using VNNLanguage.Extensions;
using VNNLanguage.Model;

namespace VNNLanguage
{
    public interface IParser
    {
        GameWindowInstruction Parse(string command);
        Dictionary<string, int> GetScenarioMarkers(string[] lines);
    }

    public class DirtyParser : IParser
    {
        IInstructor instructor;

        public DirtyParser(IInstructor instructor)
        {
            this.instructor = instructor;
        }

        public Dictionary<string, int> GetScenarioMarkers(string[] lines)
        {
            return lines.Where(s => s.Contains("BEGIN SCENARIO")).ToDictionary(k => k, k => Array.IndexOf(lines, k));
        }

        /// <summary>
        /// Does each line at a time
        /// </summary>
        /// <param name="command">One Command Line</param>
        /// <returns></returns>
        public GameWindowInstruction Parse(string command)
        {
            if(command.ContainsInsensitive("says"))
            {
                string characterName = GetPrimaryCharacterName(command);
                if(RegexConstants.GetStuffInQuotes.IsMatch(command))
                {
                    if(!string.IsNullOrEmpty(characterName))
                    {
                        instructor.CheckCharacterExists(characterName);
                    }
                    var says = RegexConstants.GetStuffInQuotes.Match(command).Captures[0].Value;
                    return new GameWindowInstruction("WriteText", new object[] { characterName, says.TrimStart('"').TrimEnd('"') });
                }
                else
                {
                    throw new ParserException("The character must say something", command);
                }
            }

            if(command.ContainsInsensitive("add"))
            {
                string characterName = GetPrimaryCharacterName(command);
                string sprite = RegexConstants.GetSprite.Match(command).Captures[0].Value.Trim();
                if (string.IsNullOrEmpty(sprite) || sprite.Length < 4)
                {
                    throw new ParserException("Sprite was invalid");
                }
                string animation = RegexConstants.GetStuffInAstrix.Match(command).Captures[0].Value;
                sprite = sprite.Substring(2, sprite.Length - 4);
                instructor.AddCharacter(characterName.Trim(), sprite, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')));
                return null;

            }

            if(command.ContainsInsensitive("remove"))
            {
                string characterName = GetPrimaryCharacterName(command);
                instructor.RemoveCharacter(characterName, Animation.FadeOut);
                return new GameWindowInstruction("WipeImage", new object[] { characterName, Animation.FadeOut });
            }

            if (command.ContainsInsensitive("show"))
            {
                string characterName = GetPrimaryCharacterName(command);
                string animation = RegexConstants.GetStuffInAstrix.Match(command).Captures[0].Value;
                instructor.ShowCharacter(characterName, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')));
                return new GameWindowInstruction("DrawImage", new object[] { characterName, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')) });

            }

            if (command.ContainsInsensitive("hide"))
            {
                string characterName = GetPrimaryCharacterName(command);
                string animation = RegexConstants.GetStuffInAstrix.Match(command).Captures[0].Value;
                instructor.HideCharacter(characterName, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')));
                return new GameWindowInstruction("WipeImage", new object[] { characterName, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')) });

            }

            if (command.StartsWith("MOVE"))
            {
                var directionValues = Enum.GetValues(typeof(Direction)).Cast<Direction>().Select(d=> d.ToString());
                string characterName = GetPrimaryCharacterName(command);
                var moveBy = RegexConstants.GetPixelValue.IsMatch(command) 
                    ? RegexConstants.GetPixelValue.Match(command).Captures[0].Value.Replace("px", string.Empty) 
                    : throw new ParserException("Specify how much to move the character");

                var direction = command.FindAndGetKeywords(directionValues);
                instructor.MoveCharacter(characterName, direction.ToEnum<Direction>(), Convert.ToInt32(moveBy));
                return new GameWindowInstruction("DrawImage", new object[] { characterName, direction.ToEnum<Direction>(), Convert.ToInt32(moveBy) });
            }

            if(command.StartsWith("PLACE"))
            {
                string characterName = GetPrimaryCharacterName(command);
                var numericMatches = RegexConstants.GetRoundBracketNumbers.Matches(command);

                if (numericMatches.Count == 2)
                {
                    int x = int.TryParse(numericMatches[0].Value, out int xval) ? xval : throw new ParserException("X was not defined properly");
                    int y = int.TryParse(numericMatches[1].Value, out int yval) ? yval : throw new ParserException("Y was not defined properly");

                    instructor.PlaceCharacter(characterName, x, y);
                    return new GameWindowInstruction("DrawImage", new object[] { characterName, x, y });
                }

                if (numericMatches.Count == 4)
                {
                    int x = int.TryParse(numericMatches[0].Value, out int xval)? xval: throw new ParserException("X was not defined properly");
                    int y = int.TryParse(numericMatches[1].Value, out int yval) ? yval : throw new ParserException("Y was not defined properly");
                    int scaleHeight = int.TryParse(numericMatches[2].Value, out int yscaleVal) ? yscaleVal : throw new ParserException("Scale Height was not defined properly");
                    int scaleWidth = int.TryParse(numericMatches[3].Value, out int xscaleVal) ? xscaleVal : throw new ParserException("Scale Width was not defined properly");

                    instructor.PlaceCharacter(characterName, x, y, scaleHeight, scaleWidth);
                    return new GameWindowInstruction("DrawImage", new object[] { characterName, x, y, scaleHeight, scaleWidth });
                }
                else
                {
                    throw new ParserException("The number of values in the paramters is invalid");
                }
            }

            throw new NotImplementedException();
        }

        private string GetPrimaryCharacterName(string command)
        {
            if(RegexConstants.CharacterNameRegex.IsMatch(command))
            {
                return RegexConstants.CharacterNameRegex.Match(command).Captures[0].Value.TrimStart('[').TrimEnd(']');
            }
            return string.Empty;
        }
    }
}
