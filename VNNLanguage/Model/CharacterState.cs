using System;
using System.Collections.Concurrent;
using System.Drawing;
using System.Linq;

namespace VNNLanguage.Model
{
    public sealed class CharacterState
    {
        private static readonly Lazy<CharacterState> characterState = new Lazy<CharacterState>(()=> new CharacterState());

        public static CharacterState Instance { get {return characterState.Value; } }

        private ConcurrentDictionary<Guid, Character> characters;

       private CharacterState()
       {
            characters = new ConcurrentDictionary<Guid, Character>();
       }

        public bool CharacterExists(string friendlyName)
        {
            return characters.Any(c => c.Value.FriendlyName == friendlyName);
        }

        public bool AddCharacter(Character character)
        {
            var identifier = Guid.NewGuid();
            character.Identifier = identifier;
            return characters.TryAdd(identifier, character);
        }

        public bool RemoveCharacter(string friendlyName)
        {
            if(CharacterExists(friendlyName))
            {
                var characterId = characters.First(c => c.Value.FriendlyName == friendlyName).Key;
                return characters.TryRemove(characterId, out Character removedCharacter);
            }
            return false;
        }

        public bool PlaceCharacter(string friendlyName, int x, int y, int height, int width)
        {
            if (CharacterExists(friendlyName))
            {
                var character = characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.Position.XAxis = x;
                character.Value.Position.YAxis = y;
                character.Value.SpriteHeight = height;
                character.Value.SpriteWidth = width;
                return true;
            }
            return false;
        }

        public bool ShowCharacter(string friendlyName)
        {
            if (CharacterExists(friendlyName))
            {
                var character = characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.InScene = true;
                return true;
            }
            return false;
        }

        public bool HideCharacter(string friendlyName)
        {
            if (CharacterExists(friendlyName))
            {
                var character = characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.InScene = false;
                return true;
            }
            return false;
        }

        public void ChangeCharacterName(string friendlyName, string newDisplayName)
        {
            if (CharacterExists(friendlyName))
            {
                var character = characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.DisplayName = newDisplayName;
            }
        }

        public bool ChangeSprite(string friendlyName, Bitmap sprite)
        {
            if (CharacterExists(friendlyName))
            {
                var character = characters.First(c => c.Value.FriendlyName == friendlyName);
                character.Value.CurrentSprite = sprite;
                return true;
            }
            return false;
        }


    }
}
