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
                state.CurrentScenario = new RunningScenario();
            }
            return state.CurrentScenario;
        }
    }

    public class Game
    {
        public ImageFormatType ImageFormatType { get; set; }

        public string Title { get; set; }

        public bool DebugMode { get; set; }

        public string StartFile { get; set; }

        public string ScenarioExtension { get; set; }

        public RunningScenario CurrentScenario { get; set; }

    }

    public class RunningScenario
    {
        public string Background { get; set; }

        public int Line { get; set; }

        public bool Redraw { get; set; }
    }
}
