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

        public void SetupGameStateFromMetaData(Metadata metaData)
        {
            state.Title = metaData.Title;
            state.ImageFormatType = metaData.PictureFormatType;
        }

        public string GetTitle()
        {
            return state.Title;
        }

        public ImageFormatType GetImageFormat()
        {
            return state.ImageFormatType;
        }


    }

    public class Game
    {
        public ImageFormatType ImageFormatType { get; set; }

        public string Title { get; set; }

        public bool DebugMode { get; set; }
    }
}
