using Newtonsoft.Json;
using SMLanguage.Models;
using System;
using System.IO;
using System.Text;

namespace MetadataGenerator
{
    class Program
    {
        static string version = "ALPHA";
        static void Main(string[] args)
        {
            var serializer = new JsonSerializer
            {
                Formatting = Formatting.Indented
            };
            var generatedMetaDataFile = new Metadata
            {
                DateGenerated = DateTime.UtcNow,
                VersionHash = HashVersion(),
                PictureFormatType = ImageFormatType.PNG, //Hardcode it to PNG for now
                ScenarioExtension = "txt"
            };

            Console.BackgroundColor = ConsoleColor.Blue;
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("=====Metadata Generator===== ");
            Console.WriteLine("What is the title of your game?");
            generatedMetaDataFile.Title = Console.ReadLine();
            Console.WriteLine("Who is the creator of this game?");
            generatedMetaDataFile.Author = Console.ReadLine();
            Console.WriteLine("Please type in the version number for this game");
            generatedMetaDataFile.Version = Console.ReadLine();
            Console.WriteLine("Please enter the name of the start file (without the extension)");
            generatedMetaDataFile.StartFile = Console.ReadLine();
            using (var sw = new StreamWriter(@"Metadata.json"))
            using (var writer = new JsonTextWriter(sw))
            {
                serializer.Serialize(writer, generatedMetaDataFile);
            }

            Console.WriteLine("Congratulations, your new metadata file has been generated");
            Console.ReadLine();
        }

        private static string HashVersion()
        {
            var md5 = System.Security.Cryptography.MD5.Create();       
            byte[] inputBytes = Encoding.ASCII.GetBytes(version);
            byte[] hash = md5.ComputeHash(inputBytes);
            var sb = new StringBuilder();
            for (int i = 0; i < hash.Length; i++)
            {
                sb.Append(hash[i].ToString("X2"));
            }
            return sb.ToString();
        }
    }
}
