
using SFML.Graphics;
using SFML.Window;
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

        private readonly IContentManager contentManager;
        private readonly IParser parser;
        private Texture2d speech;


        public SceneWindow(IContentManager contentManager, IParser parser)
        {
            this.contentManager = contentManager;
            this.parser = parser;
            TestSFMLWindow();

        }

        private void TestSFMLWindow()
        {
            var window = new RenderWindow(new SFML.Window.VideoMode(200, 200), "Will it run");
            window.KeyPressed += Window_KeyPressed;
            var shape = new CircleShape(100f);
            shape.FillColor = SFML.Graphics.Color.Green;

            while (window.IsOpen)
            {

                    window.Clear();
                    window.Draw(shape);
                    window.Display();
            }
          
        }

        private void Window_KeyPressed(object sender, KeyEventArgs e)
        {
            var window = (SFML.Window.Window)sender;
            if (e.Code == SFML.Window.Keyboard.Key.Escape)
            {
                window.Close();
            }
        }

        private void DrawScene(Texture2d t)
        {

        }

        void DrawCharacter(Texture2d t, int width, int height)
        {

        }


        private void WindowLoad(object sender, EventArgs e)
        {

        }

        [Obsolete("This only used in the POC, this should go once the parser has been properly implemented")]
        private void LoadImage(string file, ref Texture2d t)
        {

        }

        private Texture2d LoadImage(string character, string sprite, ImageType type)
        {
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

        }


        private void RenderImage()
        {

        }

        private void RenderImage(float scaleX, float scaleY, float scaleZ,
            float transX, float transY, float transZ,
            float rotateZ)
        {

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
            RenderImage(1.5f, 1.5f, 1f, 0f, (600 - (173)), 0f, 0f);
            DrawCharacter(character, character.Width - 500, character.Height - 500);
        }
    }
}
