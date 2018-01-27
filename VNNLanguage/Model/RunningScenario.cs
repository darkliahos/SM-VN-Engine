using System;
using System.Collections.Concurrent;

namespace VNNLanguage.Model
{
    public class RunningScenario
    {
        public string Background { get; set; }

        public int Line { get; set; }

        public bool Redraw { get; set; }

        public ConcurrentDictionary<Guid, Character> Characters;
    }
}
