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

        void AddCharacter(string friendlyName, byte[] image, Animation animation, int height, int width);

        void ChangeCharacterDisplayName(string friendlyName, string displayName);

        bool CheckCharacterExists(string friendlyName);

        void HideCharacter(string friendlyName, Animation animation);

        void RemoveCharacter(string friendlyName, Animation animation);

        void ChangeCharacterSprite(string friendlyName, byte[] image);

        void MoveCharacterSingleDirection(string friendlyName, Direction direction, int pixels);

        void MoveCharacter(string friendlyName, int height, int width);

        void PlaySound(byte[] sound);

        void EndGame();

    }


    
}
