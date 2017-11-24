using SharedModels;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using OpenTK.Graphics.OpenGL;
using System.Drawing.Imaging;

namespace VNNMedia
{
    public interface IContentManager
    {
        Bitmap GetCharacterImage(string characterName, string expression, ImageFormatType imageFormatType);

        IEnumerable<string> ReadFile(string path);

        Texture2d LoadTexture(string filePath);
    }

    public class ContentManager : IContentManager
    {
        public Bitmap GetCharacterImage(string characterName, string expression, ImageFormatType imageFormatType)
        {
            string ext = imageFormatType.ToString();
            var characterPath = $"{Directory.GetCurrentDirectory()}\\Characters\\{characterName}";
            return new Bitmap($"{characterPath}\\{expression}.{ext}");
        }

        public Texture2d LoadTexture(string filePath)
        {
            //TODO Change this to take in a bitmap, shouldn't need to give a shit about filepaths
            Bitmap bitmap = new Bitmap(filePath);

            int id = GL.GenTexture();

            BitmapData bmpData = bitmap.LockBits(
                new Rectangle(0, 0, bitmap.Width, bitmap.Height),
                ImageLockMode.ReadOnly, System.Drawing.Imaging.PixelFormat.Format32bppArgb);

            GL.BindTexture(TextureTarget.Texture2D, id);

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

            return new Texture2d(id, bitmap.Width, bitmap.Height);
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
