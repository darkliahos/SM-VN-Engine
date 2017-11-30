using SharedModels;
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

    }

    public class Game
    {
        public ImageFormatType ImageFormatType { get; set; }

        public string Title { get; set; }

        public bool DebugMode { get; set; }

        public string StartFile { get; set; }

        public string ScenarioExtension { get; set; }
    }
}
