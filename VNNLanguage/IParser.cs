using System;
using System.Text.RegularExpressions;
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
                string characterName = command.Substring(0, command.ToLower().IndexOf("says"));
                string says = command.Substring(command.ToLower().IndexOf("says") + 4, command.Length - characterName.Length - 4);

                if(string.IsNullOrWhiteSpace(says))
                {
                    throw new ParserException("The character must say something", command);
                }

                instructor.WriteLine(says.Trim(), characterName.Trim());
                return true;
            }

            if(command.ContainsInsensitive("add"))
            {
                string characterName = command.Substring(3, command.IndexOf("*") -4 );
                string sprite = command.Substring(command.IndexOf("*"), command.Length - command.LastIndexOf("*") -1);
                string animation = command.Substring(command.LastIndexOf("*")+ 1, command.Length - command.LastIndexOf("*") -1);
                var image = contentManager.GetCharacterImage(characterName, sprite.Replace("*", string.Empty));
                instructor.AddCharacter(characterName.Trim(), image, (Animation)Enum.Parse(typeof(Animation), animation.Replace(" ", string.Empty)));
                return true;

            }

            if(command.ContainsInsensitive("remove"))
            {
                string characterName = Regex.Replace(command, "remove", "", RegexOptions.IgnoreCase).TrimStart();
                instructor.RemoveCharacter(characterName, Animation.FadeOut);
                return true;
            }

            throw new NotImplementedException();
        }
    }
}
