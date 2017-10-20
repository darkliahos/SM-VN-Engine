using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VNNMedia
{
    public interface IContentManager
    {
        byte[] GetCharacterImage(string characterName, string expression);
    }

    public class ContentManager : IContentManager
    {
        public byte[] GetCharacterImage(string characterName, string expression)
        {
            throw new NotImplementedException();
        }
    }
}
