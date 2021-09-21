using System;
using Autofac;
using VNNLanguage;
using System.IO;
using Newtonsoft.Json;
using SharedModels;
using System.Linq;
using VNNLanguage.Model;
using OpenTK;
using VNNMedia;

namespace VNNStart
{
    class Program
    {

        static void Main(string[] args)
        {
            bool debug = args.Any() ? args[0] == "DEBUG" : false;
            try
            {
                var container = DiContainer.BuildContainer();
                var dirtyParser = container.Resolve<IParser>();
                var metadata = GetMetadataInfo(debug);
                GameState.Instance.SetupGameState(metadata, debug);
                var window = new GameWindow(800, 600, new OpenTK.Graphics.GraphicsMode(32, 8, 0, 0));
                var game = new SceneWindow(window, container.Resolve<IContentManager>(), dirtyParser);
                window.Run(1.0 / 60.0);
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
