using OpenTK.Windowing.Common;
using OpenTK.Windowing.Desktop;
using OpenTK.Windowing.GraphicsLibraryFramework;
using SMLanguage.Models;
using SMLanguage;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SMStart
{
    public class Stage : GameWindow
    {
        private readonly IParser parser;

        public Stage(int width, int height, string title, IParser parser) : base(GameWindowSettings.Default, new NativeWindowSettings() { Size = (height, width), Title = title})
        {
            this.parser = parser;
        }

        protected override void OnUpdateFrame(FrameEventArgs args)
        {
            base.OnUpdateFrame(args);

            MouseState mouseState = MouseState;
            KeyboardState keyboardState = KeyboardState;

            if(keyboardState.IsKeyDown(Keys.Enter))
            {
                RunScenario();
                SwapBuffers();
            }

            if (keyboardState.IsKeyDown(Keys.Escape))
            {
                Close();
            }

            if(mouseState.IsAnyButtonDown)
            {
                RunScenario();
                SwapBuffers();
            }
        }

        protected void RunScenario()
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

                if (GameState.Instance.GetRedraw())
                {
                    Drawbackground(GameState.Instance.GetCurrentBackground());
                    var charactersInScene = GameState.Instance.GetCharacterInScene();
                    foreach (var characterInScene in charactersInScene)
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
                            l = (GameState.Instance.GetCurrentLine() - 1);
                            break;
                        case "WriteText":
                            //TODO: text writing will live here
                            forceInput = true;
                            break;
                    }
                }

                if (forceInput)
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
            throw new NotImplementedException();
        }

        private void DrawCharacter(string characterName, string sprite)
        {
            throw new NotImplementedException();
        }

    }
}
