using System;
using Autofac;
using VNNLanguage;
using System.IO;
using Newtonsoft.Json;
using SharedModels;
using System.Linq;

namespace VNNStart
{
    class Program
    {
        static void Main(string[] args)
        {
            string gameTitle = "The Bastard Engine";
            try
            {
                bool debug = true; //Very Dirty, will remove and implement properly
                var container = DiContainer.BuildContainer();
                var dirtyParser = container.Resolve<IParser>();
                Console.WriteLine("Reading Metadata file...");
                var metadata = GetMetadataInfo(debug);
                gameTitle = metadata.Title;
                Console.WriteLine("Reading Scenario files...");
                RunGameScripts(ref dirtyParser, metadata.StartFile);
            }
            catch(Exception error)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"{gameTitle} errored! {error.Message}");
            }
            Console.ReadLine();
        }

        public static Metadata GetMetadataInfo(bool debug)
        {
            var path = $"{Directory.GetCurrentDirectory()}\\Metadata.json";

            if(!File.Exists(path))
            {
                string errorMessage = debug ? "Please use the metadata geneator to generate your file" : "Error finding Metadata.json, please contact your vendor";
                throw new FileNotFoundException(errorMessage);
            }

            //TODO: Need to do some validation on version hashing but that will be later

            return JsonConvert.DeserializeObject<Metadata>(File.ReadAllText(path));
        }

        public static void RunGameScripts(ref IParser parser, string startFileName)
        {
            var scenarioPath = $"{Directory.GetCurrentDirectory()}\\Scenarios";
            string[] files = Directory.GetFiles(scenarioPath, "*.txt");
            string startingFile = $"{startFileName}.txt";
            if (!files.Any(f=> f.EndsWith($"\\{startingFile}")))
            {
                throw new FileNotFoundException("Start file is missing");
            }

            var startingFileLines = File.ReadAllLines(files.First(f => f.EndsWith($"\\{startingFile}")));
            
            foreach (var line in startingFileLines)
            {
                parser.Parse(line);
            }

            foreach(var file in files.Where(f=> f != startingFile))
            {
                var scenarioLines = File.ReadAllLines(file);
                foreach (var line in scenarioLines)
                {
                    parser.Parse(line);
                }
            }
        }
    }
}
