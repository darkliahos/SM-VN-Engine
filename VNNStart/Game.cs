using OpenTK;
using OpenTK.Graphics.OpenGL;
using SharedModels;
using System;
using System.Drawing;
using System.IO;
using System.Linq;
using VNNLanguage;
using VNNLanguage.Model;
using VNNMedia;

namespace VNNStart
{
    class Game
    {
        private readonly GameWindow window;
        private readonly IContentManager contentManager;
        private readonly IParser parser;
        Texture2d texture, bg, chara, speech, speech_hd, penguin;

        public Game(GameWindow window, IContentManager contentManager, IParser parser)
        {
            this.window = window;
            this.contentManager = contentManager;
            this.parser = parser;
            window.Load += WindowLoad;
            window.UpdateFrame += WindowUpdateFrame;
            window.RenderFrame += WindowRenderFrame;
        }

        private void WindowRenderFrame(object sender, FrameEventArgs e)
        {
            RenderSetup();

            var scenarioPath = $"{Directory.GetCurrentDirectory()}\\Scenarios";
            string[] files = Directory.GetFiles(scenarioPath, $"*.{GameState.Instance.GetScenarioFileExtension()}");
            string startingFile = GameState.Instance.GetStartFile();
            if (!files.Any(f => f.EndsWith($"\\{startingFile}")))
            {
                throw new FileNotFoundException("Start file is missing");
            }

            var startingFileLines = File.ReadAllLines(files.First(f => f.EndsWith($"\\{startingFile}")));

            foreach (var line in startingFileLines)
            {
                var callBack = parser.Parse(line);
                if(callBack != null)
                {
                    //TODO: Need to store these inside of a delegate
                }
            }

            // Render_ and Draw_ could be combined to create one method.
            RenderImage();
            DrawImage(bg);

            RenderImage(1.0f, 1.0f, 1f, 400f, 100f, 0f, 0f);
            DrawImage(chara, chara.Width - 200, chara.Height - 200);

            RenderImage();
            DrawImage(speech);

            RenderImage(1.5f, 1.5f, 1f, 0f, (window.Height - (453)), 0f, 0f);
            DrawImage(speech_hd, speech_hd.Width, speech_hd.Height);

            window.SwapBuffers();
        }

        // see if you can change primitive type to quads / strips

        void DrawImage(Texture2d t)
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

        void DrawImage(Texture2d t, float transparency)
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

        void DrawImage(Texture2d t, Int32 width, Int32 height)
        {
            GL.BindTexture(TextureTarget.Texture2D, t.Id);

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

        void DrawImage(Texture2d t, Int32 width, Int32 height, float transparency)
        {
            GL.BindTexture(TextureTarget.Texture2D, t.Id);

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

        private void WindowUpdateFrame(object sender, FrameEventArgs e)
        {

        }

        private void WindowLoad(object sender, EventArgs e)
        {
            LoadImage("download", ref texture);

            LoadImage("VN_bg", ref bg);
            LoadImage("VN_chara", ref chara); // create\set MAX_CHARAS_ON_SCREEN limit
            LoadImage("VN_speech", ref speech);
            LoadImage("VN_speech_head", ref speech_hd);
            LoadImage("download", ref penguin);
        }

        private void LoadImage(string file, ref Texture2d t)
        {
            GL.Enable(EnableCap.Blend);
            GL.BlendFunc(BlendingFactorSrc.SrcAlpha, BlendingFactorDest.OneMinusSrcAlpha);

            GL.Enable(EnableCap.DepthTest);
            GL.DepthFunc(DepthFunction.Lequal);

            GL.Enable(EnableCap.Texture2D);
            GL.Enable(EnableCap.AlphaTest);
            GL.AlphaFunc(AlphaFunction.Gequal, 0.5f);

            t = contentManager.LoadTexture(contentManager.GetImageAsset(file, GameState.Instance.GetImageFormat()));
        }

        private void RenderSetup()
        {
            GL.ClearColor(Color.Black);
            GL.Clear(ClearBufferMask.ColorBufferBit);
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);

            Matrix4 projMatrix = Matrix4.CreateOrthographicOffCenter(0, window.Width, window.Height, 0, 0, 1);

            GL.MatrixMode(MatrixMode.Projection);
            GL.LoadMatrix(ref projMatrix);
        }

        //no scale, no translation, no rotation
        private void RenderImage()
        {
            Matrix4 modelViewMatrix =
                Matrix4.CreateScale(1.0f, 1.0f, 1f) *
                // why do things at 1f, 1f, 1f scale not come out at the drawn resolution?
                Matrix4.CreateRotationZ(0f) *
                Matrix4.CreateTranslation(0f, 0f, 0f);
            GL.MatrixMode(MatrixMode.Modelview);
            GL.LoadMatrix(ref modelViewMatrix);
        }

        private void RenderImage(float scaleX, float scaleY, float scaleZ,
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

        public void RunGameScripts()
        {
            var scenarioPath = $"{Directory.GetCurrentDirectory()}\\Scenarios";
            string[] files = Directory.GetFiles(scenarioPath, $"*.{GameState.Instance.GetScenarioFileExtension()}");
            string startingFile = GameState.Instance.GetStartFile();
            if (!files.Any(f => f.EndsWith($"\\{startingFile}")))
            {
                throw new FileNotFoundException("Start file is missing");
            }

            var startingFileLines = File.ReadAllLines(files.First(f => f.EndsWith($"\\{startingFile}")));

            foreach (var line in startingFileLines)
            {
                parser.Parse(line);
            }

            foreach (var file in files.Where(f => !f.EndsWith(startingFile)))
            {
                var scenarioLines = File.ReadAllLines(file);
                foreach (var line in scenarioLines)
                {
                    parser.Parse(line);
                }
            }
        }
    }
}
