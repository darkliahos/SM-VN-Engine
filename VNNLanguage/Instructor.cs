using System.Collections.Generic;
using VNNLanguage.Model;
using System;

namespace VNNLanguage
{
    public class Instructor : IInstructor
    {
        public Instructor()
        {

        }

        public void AddCharacter(string friendlyName, byte[] image, Animation animation)
        {
            throw new NotImplementedException();
        }

        public void AddCharacter(string friendlyName, byte[] image, Animation animation, int height, int width)
        {
            throw new NotImplementedException();
        }

        public void ChangeBackground(byte[] image)
        {
            throw new NotImplementedException();
        }

        public void ChangeCharacterDisplayName(string friendlyName, string displayName)
        {
            throw new NotImplementedException();
        }

        public void ChangeCharacterSprite(string friendlyName, byte[] image)
        {
            throw new NotImplementedException();
        }

        public bool CheckCharacterExists(string friendlyName)
        {
            return CharacterState.Instance.RemoveCharacter(friendlyName);
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
            throw new NotImplementedException();
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
            throw new NotImplementedException();
        }

        public void PlaySound(byte[] sound)
        {
            throw new NotImplementedException();
        }

        public void RemoveCharacter(string friendlyName, Animation animation)
        {
            if(!CharacterState.Instance.RemoveCharacter(friendlyName))
            {
                throw new ArgumentNullException($"Failed to remove {friendlyName}");
            }
        }

        public void ShowCharacter(string friendlyName, Animation animation)
        {
            throw new NotImplementedException();
        }

        public void WriteLine(string text, string character)
        {
            throw new NotImplementedException();
        }
    }

}
