using SharedModels;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VNNMedia
{
    public interface IContentManager
    {
        Bitmap GetCharacterImage(string characterName, string expression, ImageFormatType imageFormatType);

        IEnumerable<string> ReadFile(string path);
    }

    public class ContentManager : IContentManager
    {
        public Bitmap GetCharacterImage(string characterName, string expression, ImageFormatType imageFormatType)
        {
            string ext = imageFormatType.ToString();
            var characterPath = $"{Directory.GetCurrentDirectory()}\\Characters\\{characterName}";
            return new Bitmap($"{characterPath}\\{expression}.{ext}");
        }

        public IEnumerable<string> ReadFile(string path)
        {
            if(File.Exists(path))
            {
                return File.ReadAllLines(path);
            }
            throw new FileNotFoundException($"{path} was not found");
        }
    }
}
