using SMLanguage.Models;
using StbImageSharp;

namespace SMContent
{
    public interface IPictureManager
    {
        ImageResult LoadSceneImage(string sceneName, ImageFormatType imageFormat);

        ImageResult LoadCharacterImage(string characterName, string expression, ImageFormatType imageFormatType);

        ImageResult LoadSystemImage(string fileName, ImageFormatType imageFormatType);

    }
}
