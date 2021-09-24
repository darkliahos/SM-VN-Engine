using SMLanguage.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VNNLanguage.Model
{
    public sealed class GameState
    {
        private static readonly Lazy<GameState> gameState = new Lazy<GameState>(() => new GameState());

        public static GameState Instance { get { return gameState.Value; } }

        private static Game state;

        public GameState()
        {
            state = new Game();
        }

        public void SetupGameState(Metadata metaData, bool debug)
        {
            state.Title = metaData.Title;
            state.ImageFormatType = metaData.PictureFormatType;
            state.DebugMode = debug;
            state.StartFile = metaData.StartFile;
            state.ScenarioExtension = metaData.ScenarioExtension;
        }

        public string GetTitle()
        {
            return state.Title;
        }

        public ImageFormatType GetImageFormat()
        {
            return state.ImageFormatType;
        }

        public string GetStartFile()
        {
            return $"{state.StartFile}.{state.ScenarioExtension}";
        }

        public string GetScenarioFileExtension()
        {
            return state.ScenarioExtension;
        }

        public string GetCurrentBackground()
        {
            return GetRunningScenario().Background;
        }

        public void SetCurrentBackground(string background)
        {
            GetRunningScenario().Background = background;
        }

        public void SetCurrentLine(int line)
        {
            GetRunningScenario().Line = line;
        }

        public int GetCurrentLine()
        {
            return GetRunningScenario().Line;
        }

        public bool GetRedraw()
        {
            return GetRunningScenario().Redraw;
        }

        public void SetRedraw(bool redraw)
        {
            GetRunningScenario().Redraw = redraw;
        }

        /// <summary>
        /// This is a handy method to check if the running scenario is populated
        /// </summary>
        /// <returns>Returns a current scenario if there is one, if not it creates a new instance</returns>
        private RunningScenario GetRunningScenario()
        {
            if (state.CurrentScenario == null)
            {
                state.CurrentScenario = new RunningScenario {Characters = new System.Collections.Concurrent.ConcurrentDictionary<Guid, Character>() };
            }
            return state.CurrentScenario;
        }

        public IEnumerable<Character> GetCharacterInScene()
        {
            return GetRunningScenario().Characters.Select(c => c.Value).Where(c => c.InScene).AsEnumerable();
        }

        public bool CharacterExists(string friendlyName)
        {
            return GetRunningScenario().Characters.Any(c => c.Value.FriendlyName == friendlyName);
        }

        public bool AddCharacter(Character character)
        {
            var identifier = Guid.NewGuid();
            character.Identifier = identifier;
            return GetRunningScenario().Characters.TryAdd(identifier, character);
        }

        public bool RemoveCharacter(string friendlyName)
        {
            if (CharacterExists(friendlyName))
            {
                var characterId = GetRunningScenario().Characters.First(c => c.Value.FriendlyName == friendlyName).Key;
                return GetRunningScenario().Characters.TryRemove(characterId, out Character removedCharacter);
            }
            return false;
        }

        public bool PlaceCharacter(string friendlyName, int x, int y, int height, int width)
        {
            if (CharacterExists(friendlyName))
            {
                var character = GetRunningScenario().Characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.Position.XAxis = x;
                character.Value.Position.YAxis = y;
                character.Value.SpriteHeight = height;
                character.Value.SpriteWidth = width;
                return true;
            }
            return false;
        }

        public bool ShowCharacter(string friendlyName)
        {
            if (CharacterExists(friendlyName))
            {
                var character = GetRunningScenario().Characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.InScene = true;
                return true;
            }
            return false;
        }

        public bool HideCharacter(string friendlyName)
        {
            if (CharacterExists(friendlyName))
            {
                var character = GetRunningScenario().Characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.InScene = false;
                return true;
            }
            return false;
        }

        public void ChangeCharacterName(string friendlyName, string newDisplayName)
        {
            if (CharacterExists(friendlyName))
            {
                var character = GetRunningScenario().Characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.DisplayName = newDisplayName;
            }
        }

        public bool ChangeSprite(string friendlyName, string sprite)
        {
            if (CharacterExists(friendlyName))
            {
                var character = GetRunningScenario().Characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.CurrentSprite = sprite;
                return true;
            }
            return false;
        }
    }
}
