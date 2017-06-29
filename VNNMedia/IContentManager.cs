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
}
