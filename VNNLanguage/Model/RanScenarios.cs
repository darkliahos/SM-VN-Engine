using System;

namespace VNNLanguage.Model
{
    public class RanScenario
    {
        public string Name { get; set; }

        public Guid Id { get; set; }

        public int LastRunNumber { get; set; }

        public ScenarioStatus Status { get; set; }
    }

}
