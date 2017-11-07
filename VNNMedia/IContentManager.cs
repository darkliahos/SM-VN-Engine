using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VNNMedia
{
    public interface IContentManager
    {
        byte[] GetCharacterImage(string characterName, string expression);

        IEnumerable<string> ReadFile(string path);
    }

    public class ContentManager : IContentManager
    {
        public byte[] GetCharacterImage(string characterName, string expression)
        {
            throw new NotImplementedException();
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
