using OpenTK.Graphics.OpenGL;
using SMLanguage.Models;
using StbImageSharp;

namespace SMContent
{
    public class PictureManager : IPictureManager
    {
        public ImageResult LoadCharacterImage(string characterName, string expression, ImageFormatType imageFormatType)
        {
            var ext = imageFormatType.ToString();
            var characterPath = $"{Directory.GetCurrentDirectory()}\\Characters\\{characterName}\\{expression}.{ext}";
            return LoadImage(characterPath);
        }

        public ImageResult LoadSceneImage(string sceneName, ImageFormatType imageFormat)
        {
            string ext = imageFormat.ToString();
            var sceneFilePath = $"{Directory.GetCurrentDirectory()}\\Scenes\\{sceneName}.{ext}";
            return LoadImage(sceneFilePath);
        }

        public ImageResult LoadSystemImage(string fileName, ImageFormatType imageFormatType)
        {
            var ext = imageFormatType.ToString();
            var assetFilePath = $"{Directory.GetCurrentDirectory()}\\Assets\\{fileName}.{ext}";
            return LoadImage(assetFilePath);
        }

        private ImageResult LoadImage(string directory)
        {
            if (!File.Exists(directory))
            {
                throw new ArgumentException($"Unable to find Image {directory}");
            }
            
            StbImage.stbi_set_flip_vertically_on_load(1);
            return ImageResult.FromStream(File.OpenRead(directory), ColorComponents.RedGreenBlueAlpha);
        }
    }
}
