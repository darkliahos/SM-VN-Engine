using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Linq;
using System.Text;
using SMVisualNovelEngine45.Content_Managers;
using OpenTK;
using OpenTK.Graphics;
using OpenTK.Input;

namespace SMVisualNovelEngine45
{
    class GLWindow:GameWindow
    {
        public VSyncMode VSync { get; set; }
        public static int ResWidth { get; set; }
        public static int ResHeight { get; set; }
        public static string title { get; set; }
        public Color BackgroundColor { get; set; }
        public InstructionSet StartingInstructions { get; set; }
        public ImageManager imageManager = new ImageManager();
        private StandardImage texture;

        public GLWindow()
            : base(800, 600, GraphicsMode.Default, "Test")
        {
            GL.ClearColor(0, 0.1f, 0.4f, 1);
            //LoadInstructions(StartingInstructions);
            //texture = imageManager.LoadImage(@"C:\Koala.jpg");
        }

        /// <summary>
        /// Loads Instructions that are passed into the engine
        /// </summary>
        /// <param name="Instructions"></param>
        public void LoadInstructions(InstructionSet Instructions)
        {
            if(Instructions != null)
            {
                throw new NotImplementedException();
            }
            else
            {
                Console.WriteLine(Instructions.Description + " Failed To Load");
            }
            
        }

        /// <summary>Load resources here.</summary>
        /// <param name="e">Not used.</param>
        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);
            GL.ClearColor(BackgroundColor);
            //GL.ClearColor(0.1f, 0.2f, 0.5f, 0.0f);
            GL.Enable(EnableCap.DepthTest);
        }

        /// <summary>
        /// Called when your window is resized. Set your viewport here. It is also
        /// a good place to set up your projection matrix (which probably changes
        /// along when the aspect ratio of your window).
        /// </summary>
        /// <param name="e">Not used.</param>
        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);

            GL.Viewport(ClientRectangle.X, ClientRectangle.Y, ClientRectangle.Width, ClientRectangle.Height);

            Matrix4 projection = Matrix4.CreatePerspectiveFieldOfView((float)Math.PI / 4, Width / (float)Height, 1.0f, 64.0f);
            GL.MatrixMode(MatrixMode.Projection);
            GL.LoadMatrix(ref projection);
        }

        /// <summary>
        /// Called when it is time to setup the next frame. Add you game logic here.
        /// </summary>
        /// <param name="e">Contains timing information for framerate independent logic.</param>
        protected override void OnUpdateFrame(FrameEventArgs e)
        {
            base.OnUpdateFrame(e);

            if (Keyboard[Key.Escape])
                Exit();
        }

        /// <summary>
        /// Called when it is time to render the next frame. Add your rendering code here.
        /// </summary>
        /// <param name="e">Contains timing information.</param>
        protected override void OnRenderFrame(FrameEventArgs e)
        {
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);

            DrawImage(texture);

            SwapBuffers();
        }


        

        public static void DrawImage(StandardImage image)
        {
            //int thirdOf = 800/3;
            //int offsetOf = 50;
            GL.MatrixMode(MatrixMode.Projection);
            GL.PushMatrix();
            GL.LoadIdentity();

            GL.Ortho(image.Left, image.Right,image.Bottom, image.Top, -1, 1);

            GL.MatrixMode(MatrixMode.Modelview);
            GL.PushMatrix();
            GL.LoadIdentity();

            GL.Disable(EnableCap.Lighting);

            GL.Enable(EnableCap.Texture2D);

            GL.BindTexture(TextureTarget.Texture2D, image.BinData);

            //Draws a square
            GL.Begin(BeginMode.Quads);

            //Bottom Left Corner
            GL.TexCoord2(0, 1);
            GL.Vertex3(image.BottomLeft.X, image.BottomLeft.Y, image.BottomLeft.Z);

            //Bottom Right Corner
            GL.TexCoord2(1, 1);
            GL.Vertex3(image.BottomRight.X, image.BottomRight.Y, image.BottomRight.Z);

            //Top Right Corner
            GL.TexCoord2(1, 0);
            GL.Vertex3(image.TopRight.X, image.TopRight.Y, image.TopRight.Z);

            //Top Left Corner
            GL.TexCoord2(0, 0);
            GL.Vertex3(image.TopLeft.X, image.TopLeft.Y, image.TopLeft.Z);

            GL.End();

            GL.Disable(EnableCap.Texture2D);
            GL.PopMatrix();

            GL.MatrixMode(MatrixMode.Projection);
            GL.PopMatrix();

            GL.MatrixMode(MatrixMode.Modelview);
        }

    }
}
