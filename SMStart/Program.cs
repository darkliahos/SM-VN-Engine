// See https://aka.ms/new-console-template for more information
using Autofac;
using Newtonsoft.Json;
using SMLanguage;
using SMLanguage.Models;
using SMStart;

class Program
{
    static void Main(string[] args)
    {
        bool debug = args.Any() ? args[0] == "DEBUG" : false;

        var container = DiContainer.BuildContainer();
        var dirtyParser = container.Resolve<IParser>();
        var alertHandler = container.Resolve<IAlertHandler>();
        try
        {
            var metadata = GetMetadataInfo(debug);
            GameState.Instance.SetupGameState(metadata, debug);

            using Stage stage = new(800, 600, metadata.Title, dirtyParser);
            stage.Run();


        }
        catch (Exception error)
        {
            alertHandler.ShowError(error);
        }
        Console.ReadLine();
    }

    private static Metadata GetMetadataInfo(bool debug)
    {
        var path = $"{Directory.GetCurrentDirectory()}\\Metadata.json";

        if (!File.Exists(path))
        {
            string errorMessage = debug ? "Please use the metadata geneator to generate your file" : "Error finding Metadata.json, please contact your vendor";
            throw new FileNotFoundException(errorMessage);
        }

        //TODO: Need to do some validation on version hashing but that will be later

        return JsonConvert.DeserializeObject<Metadata>(File.ReadAllText(path));
    }
}