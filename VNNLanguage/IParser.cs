using System;
using VNNLanguage.Exceptions;
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
            if(command.ToLower().Contains("says"))
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

            if(command.ToLower().Contains("Add Character"))
            {

            }

            throw new NotImplementedException();
        }
    }
}
