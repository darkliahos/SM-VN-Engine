namespace VNNLanguage.Model
{
    public class GameWindowInstruction
    {
        public string MethodName { get; set; }

        public object[] Parameters { get; set; }

        public GameWindowInstruction(string methodName, object[]parameters)
        {
            this.MethodName = methodName;
            this.Parameters = parameters;
        }
    }
}