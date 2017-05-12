using System;
using System.Collections.Generic;

namespace SMVisualNovelEngine45
{
    public class InstructionSet:IInstructionSet
    {
        public Guid UniqueId { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }

        public List<string> InstructionLine { get; set; }

        public InstructionSet(Guid uniqueId, string description, string location)
        {
            UniqueId = uniqueId;
            Description = description;
            Location = location;
        }

        public void ReadInstructionLineFromFile()
        {
            string line;
            InstructionLine = new List<string>();
            var file = new System.IO.StreamReader(Location);
            while ((line = file.ReadLine()) != null)
            {
                InstructionLine.Add(line);
            }

            file.Close();
        }
    }
}