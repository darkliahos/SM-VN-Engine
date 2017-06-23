namespace VNNLanguage
{
    public class Character
    {
        public int CharacterIndex { get; set; }

        public string CharacterFriendlyName { get; set; }

        public Coordinate Position { get; set; }

        public int SpriteHeight { get; set; }

        public int SpriteWidth { get; set; }

        public byte[] CurrentSprite { get; set; }

        public bool IsVisible { get; set; }
    }

}
