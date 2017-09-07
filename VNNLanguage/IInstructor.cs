using System.Collections.Generic;


namespace VNNLanguage
{
    /// <summary>
    /// These are for commands that will be features that will underpin the engine
    /// </summary>
    public interface IInstructor
    {
        //This will need to be protected in the implementation
        //List<Character> InscopeCharacters { get; set; }

        //This will also need to be protected 
        //byte[] CurrentBackground { get; set; }

        void WriteLine(string text, string character);

        void JumpLine(int number);

        void CreateFork(IEnumerable<(string text, string forkHandlerName)>choices);

        void ChangeBackground(byte[] image);

        /// <summary>
        /// This will add the character to the centre of the screen by default
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <param name="image"></param>
        /// <param name="animation"></param>
        void AddCharacter(string friendlyName, byte[] image, Animation animation);

        /// <summary>
        /// This is designed to give the user more control where to place the character
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <param name="image"></param>
        /// <param name="animation"></param>
        /// <param name="height"></param>
        /// <param name="width"></param>
        void AddCharacter(string friendlyName, byte[] image, Animation animation, int height, int width);

        void ChangeCharacterDisplayName(string friendlyName, string displayName);

        bool CheckCharacterExists(string friendlyName);

        void ShowCharacter(string friendlyName, Animation animation);

        void HideCharacter(string friendlyName, Animation animation);

        void RemoveCharacter(string friendlyName, Animation animation);

        void ChangeCharacterSprite(string friendlyName, byte[] image);

        void MoveCharacter(string friendlyName, Direction direction, int pixels);

        void PlaceCharacter(string friendlyName, int x, int y, int scaleHeight = 0, int scaleWidth= 0);

        void PlaySound(byte[] sound);

        void EndGame();

    }


    
}
