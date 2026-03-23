using Autofac;
using Microsoft.Xna.Framework;
using Newtonsoft.Json;
using SMContent;
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
        var pictureManager = container.Resolve<IPictureManager>();
        try
        {
            var metadata = GetMetadataInfo(debug);
            GameState.Instance.SetupGameState(metadata, debug);

            using var game = new Stage(dirtyParser, pictureManager, metadata.Title);
            game.Run();
        }
        catch (Exception error)
        {
            alertHandler.ShowError(error);
        }
    }

    private static Metadata GetMetadataInfo(bool debug)
    {
        var path = Path.Combine(Directory.GetCurrentDirectory(), "Metadata.json");

        if (!File.Exists(path))
        {
            string errorMessage = debug ? "Please use the metadata geneator to generate your file" : "Error finding Metadata.json, please contact your vendor";
            throw new FileNotFoundException(errorMessage);
        }

        return JsonConvert.DeserializeObject<Metadata>(File.ReadAllText(path))!;
    }
}