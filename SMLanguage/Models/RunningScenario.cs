using System;
using System.Collections.Concurrent;

namespace SMLanguage.Models
{
    public class RunningScenario
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public string Background { get; set; }

        public int Line { get; set; }

        public bool Redraw { get; set; }

        public ConcurrentDictionary<Guid, Character> Characters;

        public ChoiceSelector CurrentChoiceSelector { get; set; }

        //TODO: Tree idea, maybe we can store a running tally of choices made

    }
}
