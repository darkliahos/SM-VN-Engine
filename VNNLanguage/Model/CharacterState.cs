using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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

        public bool RemoveCharacter(string friendlyname)
        {
            if(CharacterExists(friendlyname))
            {
                var characterId = characters.First(c => c.Value.FriendlyName == friendlyname).Key;
                return characters.TryRemove(characterId, out Character removedCharacter);
            }
            return false;

        }


    }
}
