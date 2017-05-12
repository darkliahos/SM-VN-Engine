using System;
using System.Drawing;
using System.Drawing.Imaging;
using OpenTK.Graphics;
using OpenTK.Graphics.ES20;

namespace SMVisualNovelEngine45.Content_Managers
{
    class ImageManager:IContentManager
    {
        /// <summary>
        /// Loads An Image from the given File Path
        /// </summary>
        /// <param name="filePath">the logical path for the file</param>
        /// <returns></returns>
        public int LoadImage(string filePath)
        {

            try
            {
                Bitmap bitmap = new Bitmap(filePath);

                int tex;
                GL.Hint(HintTarget.PerspectiveCorrectionHint, HintMode.Nicest);

                GL.GenTextures(1, out tex);
                GL.BindTexture(TextureTarget.Texture2D, tex);

                BitmapData data = bitmap.LockBits(new System.Drawing.Rectangle(0, 0, bitmap.Width, bitmap.Height),
                    ImageLockMode.ReadOnly, System.Drawing.Imaging.PixelFormat.Format32bppArgb);

                GL.TexImage2D(TextureTarget.Texture2D, 0, PixelInternalFormat.Rgba, data.Width, data.Height, 0, OpenTK.Graphics.ES20.PixelFormat.Rgba, PixelType.UnsignedByte, data.Scan0);
                bitmap.UnlockBits(data);


                GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureMinFilter, (int)TextureMinFilter.Linear);
                GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureMagFilter, (int)TextureMagFilter.Linear);
                GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureWrapS, (int)TextureWrapMode.Repeat);
                GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureWrapT, (int)TextureWrapMode.Repeat);

                return tex;
            }
            catch (ArgumentException)
            {
                Console.WriteLine(filePath + " failed to load, Invalid Image \n");
                return 0;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public StandardImage CreateImage(string filePath, int top, int bottom, int right, int left, StandardImageCorner topLeft, StandardImageCorner topRight, StandardImageCorner bottomLeft, StandardImageCorner bottomRight)
        {
            StandardImage image = new StandardImage();
            image.Left = left;
            image.Right = right;
            image.Bottom = bottom;
            image.Top = top;
            image.TopLeft = topLeft;
            image.TopRight = topRight;
            image.BottomLeft = bottomLeft;
            image.BottomRight = bottomRight;
            image.BinData = LoadImage(filePath);
            return image;
        }
    }
}
