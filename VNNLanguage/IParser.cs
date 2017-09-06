using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using VNNLanguage.Constants;
using VNNLanguage.Exceptions;
using VNNLanguage.Extensions;
using VNNMedia;

namespace VNNLanguage
{
    public interface IParser
    {
        bool Parse(string command);
    }

    public class DirtyParser : IParser
    {
        private Regex moveRegex = new Regex("^(move)", RegexOptions.IgnoreCase);
       
        IInstructor instructor;
        IContentManager contentManager;

        public DirtyParser(IInstructor instructor, IContentManager contentManager)
        {
            this.instructor = instructor;
            this.contentManager = contentManager;
        }

        /// <summary>
        /// Does each line at a time
        /// </summary>
        /// <param name="command">One Command Line</param>
        /// <returns></returns>
        public bool Parse(string command)
        {
            if(command.ContainsInsensitive("says"))
            {
                string characterName = GetPrimaryCharacterName(command);
                if(RegexConstants.GetStuffInQuotes.IsMatch(command))
                {
                    var says = RegexConstants.GetStuffInQuotes.Match(command).Captures[0].Value;
                    instructor.WriteLine(says.TrimStart('"').TrimEnd('"'), characterName);
                    return true;
                }
                else
                {
                    throw new ParserException("The character must say something", command);
                }
            }

            if(command.ContainsInsensitive("add"))
            {
                string characterName = GetPrimaryCharacterName(command);
                string sprite = command.Substring(command.IndexOf("*"), command.Length - command.LastIndexOf("*") -1);
                string animation = command.Substring(command.LastIndexOf("*")+ 1, command.Length - command.LastIndexOf("*") -1);
                var image = contentManager.GetCharacterImage(characterName, sprite.Replace("*", string.Empty));
                instructor.AddCharacter(characterName.Trim(), image, (Animation)Enum.Parse(typeof(Animation), animation.Replace(" ", string.Empty)));
                return true;

            }

            if(command.ContainsInsensitive("remove"))
            {
                string characterName = GetPrimaryCharacterName(command);
                instructor.RemoveCharacter(characterName, Animation.FadeOut);
                return true;
            }

            if(command.StartsWith("MOVE"))
            {
                var directionValues = Enum.GetValues(typeof(Direction)).Cast<Direction>().Select(d=> d.ToString());
                string characterName = GetPrimaryCharacterName(command);
                var moveBy = RegexConstants.GetPixelValue.IsMatch(command) ? RegexConstants.GetPixelValue.Match(command).Captures[0].Value.Replace("px", string.Empty) : throw new ParserException("Specify how much to move the character");
                var direction = command.FindAndGetKeywords(directionValues);
                instructor.MoveCharacterSingleDirection(characterName, direction.ToEnum<Direction>(), Convert.ToInt32(moveBy));
                return true;
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
