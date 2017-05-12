using System;

namespace SMVisualNovelEngine45
{
    public interface IInstructionSet
    {
        Guid UniqueId { get; set; }

        string Description { get; set; }
        
        string Location { get; set; }

        void ReadInstructionLineFromFile();

    }
}