using System;
using Autofac;
using VNNLanguage;
using System.IO;
using Newtonsoft.Json;
using SharedModels;
using System.Linq;
using VNNLanguage.Model;
using VNNMedia;

namespace VNNStart
{
    class Program
    {

        static void Main(string[] args)
        {
            bool debug = false;

            if (args.Length > 0)
            {
                debug = args[0] == "DEBUG";
            }
            
            try
            {
                var container = DiContainer.BuildContainer();
                var dirtyParser = container.Resolve<IParser>();
                var metadata = GetMetadataInfo(debug);
                GameState.Instance.SetupGameState(metadata, debug);
                var game = new SceneWindow(container.Resolve<IContentManager>(), dirtyParser);
            }
            catch(Exception error)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"{GameState.Instance.GetTitle()} errored! {error.Message}");

                if(debug)
                {
                    Console.WriteLine(error.StackTrace);
                }

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
    }
}
