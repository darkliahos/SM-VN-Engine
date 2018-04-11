namespace SharedModels
{
    public class Texture2d
    {
        public int Id { get; set; }

        public int Width { get; set; }

        public int Height { get; set; }

        public Texture2d(int id, int width, int height)
        {
            this.Id = id;
            this.Width = width;
            this.Height = height;
        }
    }
}
