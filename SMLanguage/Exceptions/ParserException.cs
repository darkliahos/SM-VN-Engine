using System;
using System.Runtime.Serialization;

namespace SMLanguage.Exceptions
{
    /// <summary>
    /// Used whenever the parser finds code that it cannot parse
    /// </summary>
    public class ParserException:Exception
    {
        public ParserException(): base() { }

        public ParserException(string message): base(message) { }

        public ParserException(string command, string message): base($"{message} it occured with this command: {command}"){}

        public ParserException(string format, params object[] args): base(string.Format(format, args)) { }

        public ParserException(string message, Exception innerException): base(message, innerException) { }

        public ParserException(string format, Exception innerException, params object[] args): base(string.Format(format, args), innerException) { }

        protected ParserException(SerializationInfo info, StreamingContext context): base(info, context) { }
    }
}
