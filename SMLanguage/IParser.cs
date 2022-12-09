using SMLanguage.Enums;
using SMLanguage.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using SMLanguage.Constants;
using SMLanguage.Exceptions;
using SMLanguage.Extensions;

namespace SMLanguage
{
    public interface IParser
    {
        GameWindowInstruction Parse(string command);
        Dictionary<string, int> GetScenarioMarkers(string[] lines);
        int SeekIndex(string command);
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
            if (command.ContainsInsensitive("says"))
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
                return new GameWindowInstruction("DrawCharacter", new object[] { characterName, sprite, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')) });

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

            if (command.StartsWith("CHANGE SPRITE"))
            {
                string sprite = RegexConstants.GetSprite.Match(command).Captures[0].Value.Trim();
                if (string.IsNullOrEmpty(sprite) || sprite.Length < 4)
                {
                    throw new ParserException("Sprite was invalid");
                }
                sprite = sprite.Substring(2, sprite.Length - 4);
                string characterName = GetPrimaryCharacterName(command);
                string animation = RegexConstants.GetStuffInAstrix.Match(command).Captures[0].Value;
                instructor.ChangeCharacterSprite(characterName, sprite, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')));
                return new GameWindowInstruction("DrawImage", new object[] { characterName, sprite, (Animation)Enum.Parse(typeof(Animation), animation.Trim('*')) });
            }

            if (command.StartsWith("CHANGE BACKGROUND"))
            {
                string sprite = command.Replace("CHANGE BACKGROUND", string.Empty).TrimStart();
                GameState.Instance.SetCurrentBackground(sprite);
                return new GameWindowInstruction("DrawScene", new object[] { sprite});
            }

            if(command.StartsWith("PLAY SOUND"))
            {
                bool loop = command.ContainsInsensitive("loop");
                var file = RegexConstants.GetStuffInQuotes.Match(command).Captures[0].Value.Replace("\"", "");
                instructor.PlaySound(file, loop);
                return new GameWindowInstruction("PLAY SOUND", new object[] { file, loop });
            }

            if(command.StartsWith("BEGIN CHOICES"))
            {
                var choiceId = Guid.NewGuid();
                instructor.CreateFork(choiceId);
                return new GameWindowInstruction("NEW CHOICE", new object[] { choiceId });
            }

            if (command.StartsWith("QUESTION"))
            {
                var questionText = command.Remove(0, 9).Replace("\"", "");
                instructor.SetForkQuestion(questionText);
                return new GameWindowInstruction("CHOICE SET QUESTION", new object[] { questionText });
            }

            if (command.StartsWith("JUMP"))
            {
                var jumpResult = command.Replace("JUMP ", string.Empty);

                if (jumpResult.StartsWith("SCENARIO"))
                {
                    var scenario = RegexConstants.GetStuffInQuotes.Match(command).Captures[0].Value.Replace("\"", "");
                    instructor.JumpScenario(scenario);
                    return new GameWindowInstruction("Jump", new object[] { scenario });
                }
                else
                {
                    var number = Convert.ToInt32(jumpResult);
                    instructor.JumpLine(number);
                    return new GameWindowInstruction("Jump", new object[0]);
                }
            }

            if (command.StartsWith("FORK"))
            {
                var fork = command.Remove(0, 5).Replace("\"", "");
                instructor.AddChoice(fork);
                return new GameWindowInstruction("ADD CHOICE", new object[] { fork });
            }

            if (command.StartsWith("END CHOICES"))
            {
                return new GameWindowInstruction("DISPLAY CHOICE", new object[] {  });
            }


            if (command == "END STORY")
            {
                instructor.GameOver();
                return new GameWindowInstruction("EndGame", new object[0]);
            }


            throw new NotImplementedException();
        }

        public int SeekIndex(string command)
        {
            throw new NotImplementedException();
        }

        private string GetPrimaryCharacterName(string command)
        {
            if (RegexConstants.CharacterNameRegex.IsMatch(command))
            {
                return RegexConstants.CharacterNameRegex.Match(command).Captures[0].Value.TrimStart('[').TrimEnd(']');
            }
            return string.Empty;
        }
    }
}
