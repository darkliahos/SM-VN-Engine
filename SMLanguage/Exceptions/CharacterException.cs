using System;
using System.Runtime.Serialization;

namespace SMLanguage.Exceptions
{
    public class CharacterException:Exception
    {
        public CharacterException(): base() { }

        public CharacterException(string message): base(message) { }

        public CharacterException(string command, string message): base($"{message} it occured with this command: {command}"){ }

        public CharacterException(string format, params object[] args): base(string.Format(format, args)) { }

        public CharacterException(string message, Exception innerException): base(message, innerException) { }

        public CharacterException(string format, Exception innerException, params object[] args): base(string.Format(format, args), innerException) { }

        protected CharacterException(SerializationInfo info, StreamingContext context): base(info, context) { }
    }
}
