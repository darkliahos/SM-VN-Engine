using System.Collections.Generic;


namespace VNNLanguage
{

    public interface IInstructor
    {
        List<Character> InscopeCharacters { get; set; }

        byte[] CurrentBackground { get; set; }

        void WriteLine(string text, string character);

        void JumpLine(int number);

        void CreateFork(IEnumerable<(string text, string forkHandlerName)>choices);

        void ChangeScene(byte[] image);

        void AddCharacter(byte[] image, Animation animation, int height, int width);

        void RemoveCharacter(int index, Animation animation);

        void ChangeCharacterSprite(int index, byte[] image);

        void MoveCharacterSingle(int index, Direction direction, int pixels);

        void MoveCharacter(int index, int height, int width);

        void PlaySound(byte[] sound);

        void EndGame();

    }


    
}
