using System;
using System.Runtime.Serialization;

namespace SMLanguage.Exceptions
{
    [Serializable]
    internal class ScenarioNotRunningException : Exception
    {
        public ScenarioNotRunningException()
        {
        }

        public ScenarioNotRunningException(string message) : base(message)
        {
        }

        public ScenarioNotRunningException(string message, Exception innerException) : base(message, innerException)
        {
        }

        protected ScenarioNotRunningException(SerializationInfo info, StreamingContext context) : base(info, context)
        {
        }
    }
}