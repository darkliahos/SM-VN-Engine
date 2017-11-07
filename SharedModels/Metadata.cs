using System;

namespace SharedModels
{
    public class Metadata
    {
        public string Title { get; set; }

        public string Author { get; set; }

        public string Version { get; set; }

        public DateTime DateGenerated { get; set; }

        public string VersionHash { get; set; }

        public string StartFile { get; set; }
    }
}
