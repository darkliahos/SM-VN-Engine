﻿using OpenTK;
using OpenTK.Graphics.OpenGL;
using OpenTK.Input;
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
    public class SceneWindow
    {
        private readonly GameWindow window;
        private readonly IContentManager contentManager;
        private readonly IParser parser;
        private Texture2d speech;
        private KeyboardState lastKeyState;

        public SceneWindow(GameWindow window, IContentManager contentManager, IParser parser)
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
            //TODO MENU Load and interaction will live here
        }

        private void DrawScene(Texture2d t)
        {
            GL.BindTexture(TextureTarget.Texture2D, t.Id);

            GL.Begin(PrimitiveType.Triangles);

            GL.Color4(1f, 1f, 1f, 1f);
            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(window.Width, window.Height);
            GL.TexCoord2(0, 1); GL.Vertex2(0, window.Height);

            GL.TexCoord2(0, 0); GL.Vertex2(0, 0);
            GL.TexCoord2(1, 0); GL.Vertex2(window.Width, 0);
            GL.TexCoord2(1, 1); GL.Vertex2(window.Width, window.Height);

            GL.End();
        }

        void DrawCharacter(Texture2d t, int width, int height)
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

        private void WindowUpdateFrame(object sender, FrameEventArgs e)
        {
            var mState = Mouse.GetCursorState();
            var mousePos = window.PointToClient(new Point(mState.X, mState.Y));
            if (mState.LeftButton == ButtonState.Pressed)
            {
                Console.WriteLine(mousePos.X + ", " + mousePos.Y);
            }

            var keyState = Keyboard.GetState();
            if (keyState.IsKeyDown(Key.Enter) && lastKeyState.IsKeyUp(Key.Enter))
            {
                //TODO: Some Game state handling will need to exist here
                RunScenario();
                window.SwapBuffers();
            }
            lastKeyState = keyState;
        }

        private void WindowLoad(object sender, EventArgs e)
        {
            //TODO: Does this need to happen here?
            LoadImage("VN_speech", ref speech);
        }

        [Obsolete("This only used in the POC, this should go once the parser has been properly implemented")]
        private void LoadImage(string file, ref Texture2d t)
        {
            GL.Enable(EnableCap.Blend);
            GL.BlendFunc(BlendingFactor.SrcAlpha, BlendingFactor.OneMinusSrcAlpha);

            GL.Enable(EnableCap.DepthTest);
            GL.DepthFunc(DepthFunction.Lequal);

            GL.Enable(EnableCap.Texture2D);
            GL.Enable(EnableCap.AlphaTest);
            GL.AlphaFunc(AlphaFunction.Gequal, 0.5f);

            t = contentManager.LoadTexture(contentManager.GetImageAsset(file, GameState.Instance.GetImageFormat()));
        }

        private Texture2d LoadImage(string character, string sprite, ImageType type)
        {
            GL.Enable(EnableCap.Blend);
            GL.BlendFunc(BlendingFactor.SrcAlpha, BlendingFactor.OneMinusSrcAlpha);

            GL.Enable(EnableCap.DepthTest);
            GL.DepthFunc(DepthFunction.Lequal);

            GL.Enable(EnableCap.Texture2D);
            GL.Enable(EnableCap.AlphaTest);
            GL.AlphaFunc(AlphaFunction.Gequal, 0.5f);

            switch(type)
            {
                case ImageType.Character:
                    return contentManager.LoadTexture(contentManager.GetCharacterImage(character, sprite, GameState.Instance.GetImageFormat()));
                case ImageType.Scene:
                    return contentManager.LoadTexture(contentManager.GetSceneImage(sprite, GameState.Instance.GetImageFormat()));
                default:
                    throw new ArgumentOutOfRangeException($"Load Texture for {type} does not exist");
            }

            
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


        private void RunScenario()
        {
            var scenarioPath = $"{Directory.GetCurrentDirectory()}\\Scenarios";
            string[] files = Directory.GetFiles(scenarioPath, $"*.{GameState.Instance.GetScenarioFileExtension()}");
            string startingFile = GameState.Instance.GetStartFile();
            if (!files.Any(f => f.EndsWith($"\\{startingFile}")))
            {
                throw new FileNotFoundException("Start file is missing");
            }

            var startingFileLines = File.ReadAllLines(files.First(f => f.EndsWith($"\\{startingFile}")));

            for (int l = GameState.Instance.GetCurrentLine(); l < startingFileLines.Length;)
            {
                bool forceInput = false;
                var callBack = parser.Parse(startingFileLines[l]);

                if(GameState.Instance.GetRedraw())
                {
                    Drawbackground(GameState.Instance.GetCurrentBackground());
                    var charactersInScene = GameState.Instance.GetCharacterInScene();
                    foreach(var characterInScene in charactersInScene)
                    {
                        DrawCharacter(characterInScene.DisplayName, characterInScene.CurrentSprite);
                    }
                    //TODO: Redraw Character if need to
                    GameState.Instance.SetRedraw(false);
                }

                if (callBack != null)
                {
                    switch (callBack.MethodName)
                    {
                        case "DrawCharacter":
                            DrawCharacter(callBack.Parameters[0].ToString(), callBack.Parameters[1].ToString());
                            l++;
                            break;
                        case "DrawScene":
                            Drawbackground(callBack.Parameters[0].ToString());
                            l++;
                            break;
                        case "Jump":
                            // Using a zero based array and JUMP returns a 1 based value 
                            l = (GameState.Instance.GetCurrentLine() -1);
                            break;
                        case "WriteText":
                            //TODO: text writing will live here
                            forceInput = true;
                            break;
                    }
                }

                if(forceInput)
                {
                    GameState.Instance.SetRedraw(true);
                    //Store the next line in memory
                    GameState.Instance.SetCurrentLine(l + 1);
                    break;
                }
            }
        }

        private void Drawbackground(string background)
        {
            var scene = LoadImage(string.Empty, background, ImageType.Scene);
            RenderImage();
            DrawScene(scene);
        }

        private void DrawCharacter(string characterName, string sprite)
        {
            var character = LoadImage(characterName, sprite, ImageType.Character);
            RenderImage(1.0f, 1.0f, 1f, 200f, 50f, 0f, 0f);
            DrawCharacter(character, character.Width - 250, character.Height - 250);
            RenderImage();
            DrawScene(speech);
            RenderImage(1.5f, 1.5f, 1f, 0f, (window.Height - (173)), 0f, 0f);
            DrawCharacter(character, character.Width - 500, character.Height - 500);
        }
    }
}
