using System;
using System.Collections.Generic;

namespace VNNLanguage.Model
{
    public class ChoiceSelector
    {
        public Guid Id { get; set; }

        public string Question { get; set; }

        public Dictionary<string, string> Choices { get; set; }
    }
}
