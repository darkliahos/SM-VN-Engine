using SMLanguage.Enums;
using SMLanguage.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SMLanguage.Models
{
    public sealed class GameState
    {
        private static readonly Lazy<GameState> gameState = new Lazy<GameState>(() => new GameState());

        public static GameState Instance { get { return gameState.Value; } }

        // This is encased here to stop multiple things writing to it
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
            state.CurrentScenario = new RunningScenario
            {
                Name = "Start",
                Line = 0,
                Characters = new System.Collections.Concurrent.ConcurrentDictionary<Guid, Character>(),
                
            };
        }

        public string GetTitle()
        {
            return state.Title;
        }

        public static bool IsDebug()
        {
            return state.DebugMode;
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

        public void JumpScenarios(string name)
        {
            TeardownCurrentScenario(ScenarioStatus.Ejected);
            SetupScenario(name);
        }

        /// <summary>
        /// This is a handy method to check if the running scenario is populated
        /// </summary>
        /// <returns>Returns a current scenario if there is one, if not it creates a new instance</returns>
        private RunningScenario GetRunningScenario()
        {
            if (state.CurrentScenario == null)
            {
                throw new ScenarioNotRunningException();
            }
            return state.CurrentScenario;
        }

        public void TeardownCurrentScenario(ScenarioStatus status)
        {
            var _scenario = GetRunningScenario();
            state.PreviousScenarios.Add(new RanScenario
            {
                Id = _scenario.Id,
                Name = _scenario.Name,
                Status = status,
                LastRunNumber = _scenario.Line
            });
            state.CurrentScenario = null;
        }

        public RunningScenario SetupScenario(string name)
        {
            return new RunningScenario
            {
                Id = Guid.NewGuid(),
                Name = name,
                Characters = new System.Collections.Concurrent.ConcurrentDictionary<Guid, Character>(),
            };
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

        public void RemoveAllCharacters()
        {
            GetRunningScenario().Characters = new System.Collections.Concurrent.ConcurrentDictionary<Guid, Character>();
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

        public void CreateChoice(Guid id)
        {
            // TODO: Worth storing these at some stage

            // Purge previous choice selector
            GetRunningScenario().CurrentChoiceSelector.Question = "";
            GetRunningScenario().CurrentChoiceSelector.Choices = new Dictionary<string, int>();

            // Overwrite the id
            GetRunningScenario().CurrentChoiceSelector.Id = id;
        }

        public void SetChoiceQuestion(string question)
        {
            GetRunningScenario().CurrentChoiceSelector.Question = question;
        }

        public void AddChoice(string key)
        {
            GetRunningScenario().CurrentChoiceSelector.Choices.Add(key, GetCurrentLine() + 1);
        }

        private Character GetCharacter(string friendlyName)
        {
            return GetRunningScenario().Characters.Values.SingleOrDefault(c => c.FriendlyName == friendlyName);
        }
    }
}
