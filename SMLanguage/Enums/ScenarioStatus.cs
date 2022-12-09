namespace SMLanguage.Enums
{
    public enum ScenarioStatus
    {
        Unknown = 0,
        Running = 1, 
        Ejected = 2, // May not be the current running scene but it has not ended
        Ended = 3,
        Errored = 4
    }
}
