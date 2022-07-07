using System;
using System.Collections.Generic;

namespace SMLanguage.Models
{
    public class ChoiceSelector
    {
        public Guid Id { get; set; }

        public string Question { get; set; }

        public Dictionary<string, int> Choices { get; set; }
    }
}
