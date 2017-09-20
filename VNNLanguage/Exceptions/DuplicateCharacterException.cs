using System;
using System.Runtime.Serialization;

namespace VNNLanguage.Exceptions
{
    public class DuplicateCharacterException:Exception
    {
        public DuplicateCharacterException(): base() { }

        public DuplicateCharacterException(string message): base(message) { }

        public DuplicateCharacterException(string command, string message): base($"{message} it occured with this command: {command}"){ }

        public DuplicateCharacterException(string format, params object[] args): base(string.Format(format, args)) { }

        public DuplicateCharacterException(string message, Exception innerException): base(message, innerException) { }

        public DuplicateCharacterException(string format, Exception innerException, params object[] args): base(string.Format(format, args), innerException) { }

        protected DuplicateCharacterException(SerializationInfo info, StreamingContext context): base(info, context) { }
    }
}
