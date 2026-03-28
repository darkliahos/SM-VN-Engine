using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using SMContent;
using SMLanguage;
using SMLanguage.Models;

namespace SMStart
{
    public class Stage : Microsoft.Xna.Framework.Game
    {
        private readonly IParser _parser;
        private readonly IPictureManager _pictureManager;
        private readonly TextureRenderer _renderer;
        private GraphicsDeviceManager _graphics;
        private readonly List<Texture2D> _textures = new();
        private Texture2D? _backgroundTexture;
        private string? _currentBackground;
        private KeyboardState _previousKeyboard;
        private MouseState _previousMouse;

        public Stage(IParser parser, IPictureManager pictureManager, string title)
        {
            _parser = parser;
            _pictureManager = pictureManager;
            _graphics = new GraphicsDeviceManager(this);
            Content.RootDirectory = Directory.GetCurrentDirectory();
            _graphics.PreferredBackBufferWidth = 800;
            _graphics.PreferredBackBufferHeight = 600;
            Window.Title = title;
            _renderer = new TextureRenderer(this);
        }

        protected override void LoadContent()
        {
            base.LoadContent();
            var spriteImage = _pictureManager.LoadSystemImage("sprite", GameState.Instance.GetImageFormat());
            _textures.Add(TextureRenderer.CreateTexture(GraphicsDevice, spriteImage));
        }

        protected override void Update(GameTime gameTime)
        {
            base.Update(gameTime);

            var keyboardState = Keyboard.GetState();
            var mouseState = Mouse.GetState();

            if (keyboardState.IsKeyDown(Keys.Enter) && !_previousKeyboard.IsKeyDown(Keys.Enter))
            {
                RunScenario();
            }

            if (keyboardState.IsKeyDown(Keys.Escape))
            {
                Exit();
            }

            if (mouseState.LeftButton == ButtonState.Pressed && _previousMouse.LeftButton == ButtonState.Released)
            {
                RunScenario();
            }

            _previousKeyboard = keyboardState;
            _previousMouse = mouseState;
        }

        protected override void Draw(GameTime gameTime)
        {
            base.Draw(gameTime);
            GraphicsDevice.Clear(Microsoft.Xna.Framework.Color.Black);

            if (GameState.Instance.GetRedraw())
            {
                _renderer.Begin();
                DrawBackground(GameState.Instance.GetCurrentBackground());
                var charactersInScene = GameState.Instance.GetCharacterInScene();
                foreach (var characterInScene in charactersInScene)
                {
                    DrawCharacter(characterInScene.DisplayName, characterInScene.CurrentSprite, characterInScene.ScreenPosition);
                }
                _renderer.End();
                GameState.Instance.SetRedraw(false);
            }
        }

        private void RunScenario()
        {
            var scenarioPath = Path.Combine(Directory.GetCurrentDirectory(), "Scenarios");
            string[] files = Directory.GetFiles(scenarioPath, $"*.{GameState.Instance.GetScenarioFileExtension()}");
            string startingFile = GameState.Instance.GetStartFile();
            if (!files.Any(f => f.EndsWith(Path.Combine(scenarioPath, startingFile))))
            {
                throw new FileNotFoundException("Start file is missing");
            }

            var startingFileLines = File.ReadAllLines(files.First(f => f.EndsWith(Path.Combine(scenarioPath, startingFile))));

            for (int l = GameState.Instance.GetCurrentLine(); l < startingFileLines.Length;)
            {
                bool forceInput = false;
                var callBack = _parser.Parse(startingFileLines[l]);

                if (callBack != null)
                {
                    switch (callBack.MethodName)
                    {
                        case "DrawCharacter":
                            DrawCharacter(callBack.Parameters[0].ToString()!, callBack.Parameters[1].ToString()!, callBack.Parameters.Length > 3 ? Convert.ToInt32(callBack.Parameters[3]) : 1);
                            l++;
                            break;
                        case "DrawScene":
                            GameState.Instance.SetCurrentBackground(callBack.Parameters[0].ToString()!);
                            l++;
                            break;
                        case "Jump":
                            l = GameState.Instance.GetCurrentLine() - 1;
                            break;
                        case "WriteText":
                            forceInput = true;
                            break;
                    }
                }

                if (forceInput)
                {
                    GameState.Instance.SetRedraw(true);
                    GameState.Instance.SetCurrentLine(l + 1);
                    break;
                }

                if (l >= startingFileLines.Length)
                {
                    break;
                }
            }
        }

        private void DrawBackground(string background)
        {
            if (string.IsNullOrEmpty(background)) return;

            if (_currentBackground == background && _backgroundTexture != null)
            {
                return;
            }

            _backgroundTexture?.Dispose();
            var image = _pictureManager.LoadSceneImage(background, GameState.Instance.GetImageFormat());
            _backgroundTexture = TextureRenderer.CreateTexture(GraphicsDevice, image);
            _currentBackground = background;

            _renderer.DrawBackground(_backgroundTexture, _graphics.PreferredBackBufferWidth, _graphics.PreferredBackBufferHeight);
        }

        private void DrawCharacter(string characterName, string sprite, int screenPosition = 1)
        {
            var characterImage = _pictureManager.LoadCharacterImage(characterName, sprite, GameState.Instance.GetImageFormat());
            var characterTexture = TextureRenderer.CreateTexture(GraphicsDevice, characterImage);

            float targetHeight = _graphics.PreferredBackBufferHeight * 0.8f;
            float scale = targetHeight / characterImage.Height;

            float spacing = _graphics.PreferredBackBufferWidth * 0.05f;
            float spriteWidth = characterImage.Width * scale;

            float x;
            if (screenPosition == 0)
            {
                x = _graphics.PreferredBackBufferWidth * 0.1f;
            }
            else if (screenPosition == 2)
            {
                x = _graphics.PreferredBackBufferWidth * 0.9f - spriteWidth;
            }
            else
            {
                x = (_graphics.PreferredBackBufferWidth - spriteWidth) / 2;
            }
            float y = _graphics.PreferredBackBufferHeight - (characterImage.Height * scale);

            _renderer.Draw(characterTexture, new Vector2(x, y), Color.White, scale);
        }

        protected override void UnloadContent()
        {
            base.UnloadContent();
            _renderer.Dispose();
            _backgroundTexture?.Dispose();
            foreach (var texture in _textures)
            {
                texture.Dispose();
            }
        }
    }
}
