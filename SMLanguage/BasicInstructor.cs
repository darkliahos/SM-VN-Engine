using System;
using SMLanguage.Models;
using SMLanguage.Enums;
using System.Xml.Linq;

namespace SMLanguage
{
    public class BasicInstructor : IInstructor
    {
        private readonly IAlertHandler alertHandler;

        /*
* TODO: Need to move VNN Media to standard
* private IContentManager contentManager;

public BasicInstructor(IContentManager contentManager)
{
this.contentManager = contentManager;
}*/

        public BasicInstructor(IAlertHandler alertHandler)
        {
            this.alertHandler = alertHandler;
        }

        public void AddCharacter(string friendlyName, string spriteName, Animation animation)
        {
            //TODO: Need to discuss this before killing this concept
            //var image = contentManager.GetCharacterImage(friendlyName, spriteName.Replace("*", string.Empty), GameState.Instance.GetImageFormat());
            if (GameState.Instance.ShowCharacter(friendlyName))
            {
                GameState.Instance.ShowCharacter(friendlyName); //Show Character if someone is trying to add them in
            }
            else
            {
                var character = new Character
                {
                    CurrentSprite = spriteName,
                    FriendlyName = friendlyName,
                    DisplayName = friendlyName, //TODO: What do we want to do to initliase this?
                    Position = new Coordinate(300, 300),//TODO: Need to wait for the graphics engine to make it in before deciding this
                    InScene = true, 
                    SpriteHeight = 50,
                    SpriteWidth = 50
                };
                GameState.Instance.AddCharacter(character);
            }
        }

        public void AddChoice(string choice)
        {
            GameState.Instance.AddChoice(choice);
        }

        public void ChangeCharacterDisplayName(string friendlyName, string displayName)
        {
            GameState.Instance.ChangeCharacterName(friendlyName, displayName);
        }

        public void ChangeCharacterSprite(string friendlyName, string spriteName, Animation animation)
        {
            if (GameState.Instance.ChangeSprite(friendlyName, spriteName))
            {
                GameState.Instance.SetRedraw(true);
            }
        }

        public bool CheckCharacterExists(string friendlyName)
        {
            return GameState.Instance.CharacterExists(friendlyName);
        }

        public void CreateFork(Guid currentGuid)
        {
            GameState.Instance.CreateChoice(currentGuid);
        }

        public void GameOver()
        {
            GameState.Instance.TeardownCurrentScenario(ScenarioStatus.Ended);
            GameState.Instance.SetupScenario("GameOver");
            GameState.Instance.SetCurrentBackground("GameOver");
            GameState.Instance.SetRedraw(true);
        }

        public void HideCharacter(string friendlyName, Animation animation)
        {
            if (!GameState.Instance.HideCharacter(friendlyName))
            {
                alertHandler.ShowUserError(friendlyName+ " may not exist, unable to hide character");
            }
            GameState.Instance.SetRedraw(true);
        }

        public void JumpLine(int number)
        {
            GameState.Instance.SetCurrentLine(number);
        }

        public void JumpScenario(string scenario)
        {
            GameState.Instance.JumpScenarios(scenario);
            throw new NotImplementedException();
        }

        public void MoveCharacter(string friendlyName, Direction direction, int pixels)
        {
            throw new NotImplementedException();
        }

        public void PlaceCharacter(string friendlyName, int x, int y, int scaleHeight = 0, int scaleWidth = 0)
        {
            if(GameState.Instance.PlaceCharacter(friendlyName, x, y, scaleHeight, scaleWidth))
            {
                GameState.Instance.SetRedraw(true);
            }
            throw new ArgumentNullException($"Failed to place {friendlyName}");
        }

        public void PlaySound(string fileName, bool loop)
        {
            // TODO: Milestone 2
            throw new NotImplementedException();
        }

        public void RemoveCharacter(string friendlyName, Animation animation)
        {
            if(!GameState.Instance.RemoveCharacter(friendlyName))
            {
                throw new ArgumentNullException($"Failed to remove {friendlyName}");
            }
            GameState.Instance.SetRedraw(true);
        }

        public void SetForkQuestion(string question)
        {
            GameState.Instance.SetChoiceQuestion(question);
        }

        public void ShowCharacter(string friendlyName, Animation animation)
        {
            if (!GameState.Instance.ShowCharacter(friendlyName))
            {
                alertHandler.ShowUserError("Unable to show" + friendlyName + ", character may not exist");
            }
        }

        public void ShowChoices()
        {
            throw new NotImplementedException();
        }
    }

}
