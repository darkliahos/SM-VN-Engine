namespace SMVisualNovelEngine45
{
    public class StandardImage
    {
        public int BinData { get; set; }

        public int Offset { get; set; }

        public int Top { get; set; }

        public int Bottom { get; set; }

        public int Right { get; set; }

        public int Left{ get; set; }

        public StandardImageCorner TopLeft { get; set; }

        public StandardImageCorner TopRight { get; set; }

        public StandardImageCorner BottomLeft { get; set; }

        public StandardImageCorner BottomRight { get; set; }
    }
}