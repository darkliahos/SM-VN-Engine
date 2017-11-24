using OpenTK;
using OpenTK.Graphics.OpenGL;
using SharedModels;
using System;
using System.Drawing;
using VNNMedia;

namespace VNNStart
{
    class Game
    {
        private readonly GameWindow window;
        private readonly IContentManager contentManager;
        Texture2d texture, bg, chara, speech, speech_hd, penguin;

        public Game(GameWindow window, IContentManager contentManager)
        {
            this.window = window;
            this.contentManager = contentManager;
            window.Load += Window_Load;
            window.UpdateFrame += Window_UpdateFrame;
            window.RenderFrame += Window_RenderFrame;
        }

        private void Window_RenderFrame(object sender, FrameEventArgs e)
        {
            Render_setup();

            // Render_ and Draw_ could be combined to create one method.
            Render_Image();
            Draw_Image(bg);

            Render_Image();
            Draw_Image(chara);

            Render_Image();
            Draw_Image(speech);

            Render_Image();
            Draw_Image(speech_hd);

            window.SwapBuffers();
        }

        // see if you can change primitive type to quads / strips

        void Draw_Image(Texture2d t)
        {
            GL.BindTexture(TextureTarget.Texture2D, t.Id);

            GL.Begin(PrimitiveType.Triangles);

            GL.Color4(1f, 1f, 1f, 1f);
            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            // you are drawing the image only to these 
            // co -ordinates, so you're technically pre-scaling it?
            GL.TexCoord2(1, 1); GL.Vertex2(window.Width, window.Height);
            GL.TexCoord2(0, 1); GL.Vertex2(0, window.Height);

            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 0); GL.Vertex2(window.Width, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(window.Width, window.Height);

            GL.End();
        }

        void Draw_Image(Texture2d t, float transparency)
        {
            GL.BindTexture(TextureTarget.Texture2D, t.Id);

            GL.Begin(PrimitiveType.Triangles);

            GL.Color4(1f, 1f, 1f, transparency);
            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            // you are drawing the image only to these 
            // co -ordinates, so you're technically pre-scaling it?
            GL.TexCoord2(1, 1); GL.Vertex2(window.Width, window.Height);
            GL.TexCoord2(0, 1); GL.Vertex2(0, window.Height);

            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 0); GL.Vertex2(window.Width, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(window.Width, window.Height);

            GL.End();
        }

        void Draw_Image(Texture2d t, Int32 width, Int32 height)
        {
            GL.BindTexture(TextureTarget.Texture2D, texture.Id);

            GL.Begin(PrimitiveType.Triangles);

            GL.Color4(1f, 1f, 1f, 1f);
            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(width, height);
            GL.TexCoord2(0, 1); GL.Vertex2(0, height);

            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 0); GL.Vertex2(width, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(width, height);

            GL.End();
        }

        void Draw_Image(Texture2d t, Int32 width, Int32 height, float transparency)
        {
            GL.BindTexture(TextureTarget.Texture2D, texture.Id);

            GL.Begin(PrimitiveType.Triangles);

            GL.Color4(1f, 1f, 1f, transparency);
            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(width, height);
            GL.TexCoord2(0, 1); GL.Vertex2(0, height);

            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 0); GL.Vertex2(width, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(width, height);

            GL.End();
        }

        private void Window_UpdateFrame(object sender, FrameEventArgs e)
        {

        }

        private void Window_Load(object sender, EventArgs e)
        {
            Load_Image("download.png", ref texture);

            Load_Image("VN_bg.png", ref bg);
            Load_Image("VN_chara.png", ref chara); // create\set MAX_CHARAS_ON_SCREEN limit
            Load_Image("VN_speech.png", ref speech);
            Load_Image("VN_speech_head.png", ref speech_hd);
            Load_Image("download.png", ref penguin);
        }

        private void Load_Image(string file, ref Texture2d t)
        {
            GL.Enable(EnableCap.Blend);
            GL.BlendFunc(BlendingFactorSrc.SrcAlpha, BlendingFactorDest.OneMinusSrcAlpha);

            GL.Enable(EnableCap.DepthTest);
            GL.DepthFunc(DepthFunction.Lequal);

            GL.Enable(EnableCap.Texture2D);
            GL.Enable(EnableCap.AlphaTest);
            GL.AlphaFunc(AlphaFunction.Gequal, 0.5f);

            t = contentManager.LoadTexture("Content/" + file);
        }

        private void Render_setup()
        {
            GL.ClearColor(Color.Black);
            GL.Clear(ClearBufferMask.ColorBufferBit);
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);

            Matrix4 projMatrix = Matrix4.CreateOrthographicOffCenter(0, window.Width, window.Height, 0, 0, 1);

            GL.MatrixMode(MatrixMode.Projection);
            GL.LoadMatrix(ref projMatrix);
        }

        //no scale, no translation, no rotation
        private void Render_Image()
        {
            Matrix4 modelViewMatrix =
                Matrix4.CreateScale(1.0f, 1.0f, 1f) *
                // why do things at 1f, 1f, 1f scale not come out at the drawn resolution?
                Matrix4.CreateRotationZ(0f) *
                Matrix4.CreateTranslation(0f, 0f, 0f);
            GL.MatrixMode(MatrixMode.Modelview);
            GL.LoadMatrix(ref modelViewMatrix);
        }

        private void Render_Image(float scaleX, float scaleY, float scaleZ,
            float transX, float transY, float transZ,
            float rotateZ)
        {
            Matrix4 modelViewMatrix =
                Matrix4.CreateScale(scaleX, scaleY, scaleZ) *
                Matrix4.CreateRotationZ(rotateZ) *
                Matrix4.CreateTranslation(transX, transY, transZ);
            GL.MatrixMode(MatrixMode.Modelview);
            GL.LoadMatrix(ref modelViewMatrix);
        }
    }
}
