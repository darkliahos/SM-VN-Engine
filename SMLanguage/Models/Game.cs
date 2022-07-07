using System.Collections.Generic;

namespace SMLanguage.Models
{
    public class Game
    {
        public ImageFormatType ImageFormatType { get; set; }

        public string Title { get; set; }

        public bool DebugMode { get; set; }

        public string StartFile { get; set; }

        public string ScenarioExtension { get; set; }

        public RunningScenario CurrentScenario { get; set; }

        public List<RanScenario> PreviousScenarios { get; set; }

    }
}
