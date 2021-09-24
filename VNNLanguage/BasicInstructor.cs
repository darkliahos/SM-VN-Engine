using System.Collections.Generic;
using VNNLanguage.Model;
using System;
using VNNLanguage.Exceptions;
using VNNMedia;

namespace VNNLanguage
{
    public class BasicInstructor : IInstructor
    {
        private IContentManager contentManager;

        public BasicInstructor(IContentManager contentManager)
        {
            this.contentManager = contentManager;
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

        public void ChangeBackground(byte[] image)
        {
            throw new NotImplementedException();
        }

        public void ChangeCharacterDisplayName(string friendlyName, string displayName)
        {
            GameState.Instance.ChangeCharacterName(friendlyName, displayName);
        }

        public void ChangeCharacterSprite(string friendlyName, string spriteName, Animation animation)
        {
            if (GameState.Instance.ChangeSprite(friendlyName, spriteName))
            {
                throw new NotImplementedException();
            }
        }

        public bool CheckCharacterExists(string friendlyName)
        {
            return GameState.Instance.CharacterExists(friendlyName);
        }

        public void CreateFork(IEnumerable<(string text, string forkHandlerName)> choices)
        {
            throw new NotImplementedException();
        }

        public void EndGame()
        {
            throw new NotImplementedException();
        }

        public void HideCharacter(string friendlyName, Animation animation)
        {
            if (!GameState.Instance.HideCharacter(friendlyName))
            {
                throw new NotImplementedException();
            }
        }

        public void JumpLine(int number)
        {
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
                throw new NotImplementedException();
            }
            throw new ArgumentNullException($"Failed to place {friendlyName}");
        }

        public void PlaySound(string fileName, bool loop)
        {
            throw new NotImplementedException();
        }

        public void RemoveCharacter(string friendlyName, Animation animation)
        {
            if(!GameState.Instance.RemoveCharacter(friendlyName))
            {
                throw new ArgumentNullException($"Failed to remove {friendlyName}");
            }
        }

        public void ShowCharacter(string friendlyName, Animation animation)
        {
            if (!GameState.Instance.ShowCharacter(friendlyName))
            {
                throw new NotImplementedException();
            }
        }
    }

}
