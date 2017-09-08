using System.Collections.Generic;


namespace VNNLanguage
{
    public class Instructor : IInstructor
    {
        public void AddCharacter(string friendlyName, byte[] image, Animation animation)
        {
            throw new System.NotImplementedException();
        }

        public void AddCharacter(string friendlyName, byte[] image, Animation animation, int height, int width)
        {
            throw new System.NotImplementedException();
        }

        public void ChangeBackground(byte[] image)
        {
            throw new System.NotImplementedException();
        }

        public void ChangeCharacterDisplayName(string friendlyName, string displayName)
        {
            throw new System.NotImplementedException();
        }

        public void ChangeCharacterSprite(string friendlyName, byte[] image)
        {
            throw new System.NotImplementedException();
        }

        public bool CheckCharacterExists(string friendlyName)
        {
            throw new System.NotImplementedException();
        }

        public void CreateFork(IEnumerable<(string text, string forkHandlerName)> choices)
        {
            throw new System.NotImplementedException();
        }

        public void EndGame()
        {
            throw new System.NotImplementedException();
        }

        public void HideCharacter(string friendlyName, Animation animation)
        {
            throw new System.NotImplementedException();
        }

        public void JumpLine(int number)
        {
            throw new System.NotImplementedException();
        }

        public void MoveCharacter(string friendlyName, Direction direction, int pixels)
        {
            throw new System.NotImplementedException();
        }

        public void PlaceCharacter(string friendlyName, int x, int y, int scaleHeight = 0, int scaleWidth = 0)
        {
            throw new System.NotImplementedException();
        }

        public void PlaySound(byte[] sound)
        {
            throw new System.NotImplementedException();
        }

        public void RemoveCharacter(string friendlyName, Animation animation)
        {
            throw new System.NotImplementedException();
        }

        public void ShowCharacter(string friendlyName, Animation animation)
        {
            throw new System.NotImplementedException();
        }

        public void WriteLine(string text, string character)
        {
            throw new System.NotImplementedException();
        }
    }

}
