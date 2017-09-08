using System;

namespace VNNLanguage
{
    public class Character
    {
        public string FriendlyName { get; set; }

        public string DisplayName { get; set; }

        public Coordinate Position { get; set; }

        public int SpriteHeight { get; set; }

        public int SpriteWidth { get; set; }

        public byte[] CurrentSprite { get; set; }

        public bool InScene { get; set; }

        public Guid Identifier { get; set; }
    }

}
