using SharedModels;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using OpenTK.Graphics.OpenGL;
using System.Drawing.Imaging;
using System;

namespace VNNMedia
{
    public interface IContentManager
    {
        Bitmap GetCharacterImage(string characterName, string expression, ImageFormatType imageFormatType);

        Bitmap GetSceneImage(string sceneName, ImageFormatType imageFormatType);

        Bitmap GetImageAsset(string fileName, ImageFormatType imageFormatType);

        IEnumerable<string> ReadFile(string path);

        Texture2d LoadTexture(Bitmap bitmap);
    }

    public class ContentManager : IContentManager
    {
        public Bitmap GetCharacterImage(string characterName, string expression, ImageFormatType imageFormatType)
        {
            string ext = imageFormatType.ToString();
            var characterPath = $"{Directory.GetCurrentDirectory()}\\Characters\\{characterName}\\{expression}.{ext}";
            if (!File.Exists(characterPath))
            {
                throw new ArgumentException($"{expression} missing for character {characterName}");
            }
            return new Bitmap($"{characterPath}");
        }

        [Obsolete("Plan to kill this as soon as the hardwired assets are gone")]
        public Bitmap GetImageAsset(string fileName, ImageFormatType imageFormatType)
        {
            string ext = imageFormatType.ToString();
            var assetFilePath = $"{Directory.GetCurrentDirectory()}\\Assets\\{fileName}.{ext}";
            if(!File.Exists(assetFilePath))
            {
                throw new ArgumentException($"{fileName}.{ext} is not present in the assets folder");
            }

            return new Bitmap(assetFilePath);
        }

        public Bitmap GetSceneImage(string sceneName, ImageFormatType imageFormatType)
        {
            string ext = imageFormatType.ToString();
            var sceneFilePath = $"{Directory.GetCurrentDirectory()}\\Scenes\\{sceneName}.{ext}";

            if (!File.Exists(sceneFilePath))
            {
                throw new ArgumentException($"{sceneName} is missing");
            }

            return new Bitmap(sceneFilePath);
        }

        public Texture2d LoadTexture(Bitmap bitmap)
        {
            var textureGen = GL.GenTexture();

            BitmapData bmpData = bitmap.LockBits(
                new Rectangle(0, 0, bitmap.Width, bitmap.Height),
                ImageLockMode.ReadOnly, System.Drawing.Imaging.PixelFormat.Format32bppArgb);

            GL.BindTexture(TextureTarget.Texture2D, textureGen);

            GL.TexImage2D(TextureTarget.Texture2D, 0,
                PixelInternalFormat.Rgba,
                bitmap.Width, bitmap.Height, 0,
                OpenTK.Graphics.OpenGL.PixelFormat.Bgra,
                PixelType.UnsignedByte,
                bmpData.Scan0);

            bitmap.UnlockBits(bmpData);

            GL.TexParameter(TextureTarget.Texture2D,
                TextureParameterName.TextureMinFilter, (int)TextureMinFilter.Linear);
            GL.TexParameter(TextureTarget.Texture2D,
                TextureParameterName.TextureMagFilter, (int)TextureMinFilter.Linear);

            return new Texture2d(textureGen, bitmap.Width, bitmap.Height);
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
