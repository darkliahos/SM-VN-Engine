using System.Collections.Generic;


namespace VNNLanguage
{
    /// <summary>
    /// These are for commands that will be features that will underpin the engine
    /// </summary>
    public interface IInstructor
    {
        void JumpLine(int number);

        void CreateFork(IEnumerable<(string text, string forkHandlerName)>choices);

        void ChangeBackground(byte[] image);

        /// <summary>
        /// This will add the character to the centre of the screen by default
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <param name="image"></param>
        /// <param name="animation"></param>
        void AddCharacter(string friendlyName, string spriteName, Animation animation);

        void ChangeCharacterDisplayName(string friendlyName, string displayName);

        bool CheckCharacterExists(string friendlyName);

        void ShowCharacter(string friendlyName, Animation animation);

        void HideCharacter(string friendlyName, Animation animation);

        void RemoveCharacter(string friendlyName, Animation animation);

        void ChangeCharacterSprite(string friendlyName, string spriteName);

        void MoveCharacter(string friendlyName, Direction direction, int pixels);

        void PlaceCharacter(string friendlyName, int x, int y, int scaleHeight = 0, int scaleWidth= 0);

        void PlaySound(byte[] sound);

        void EndGame();

    }

}
