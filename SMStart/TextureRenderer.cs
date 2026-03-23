using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using StbImageSharp;

namespace SMStart;

public class TextureRenderer : IDisposable
{
    private readonly Game _game;
    private SpriteBatch? _spriteBatch;

    public TextureRenderer(Game game)
    {
        _game = game;
    }

    private SpriteBatch GetSpriteBatch()
    {
        if (_spriteBatch == null)
        {
            _spriteBatch = new SpriteBatch(_game.GraphicsDevice);
        }
        return _spriteBatch;
    }

    public static Texture2D CreateTexture(GraphicsDevice graphicsDevice, ImageResult image)
    {
        var texture = new Texture2D(graphicsDevice, image.Width, image.Height);
        texture.SetData(image.Data);
        return texture;
    }

    public void Begin()
    {
        GetSpriteBatch().Begin(samplerState: SamplerState.LinearWrap);
    }

    public void End()
    {
        GetSpriteBatch().End();
    }

    public void DrawBackground(Texture2D texture, int screenWidth, int screenHeight)
    {
        var destinationRectangle = new Rectangle(0, 0, screenWidth, screenHeight);
        GetSpriteBatch().Draw(texture, destinationRectangle, Color.White);
    }

    public void Draw(Texture2D texture, Vector2 position, Color color, float scale = 1f)
    {
        var origin = new Vector2(0, 0);
        GetSpriteBatch().Draw(texture, position, null, color, 0f, origin, scale, SpriteEffects.None, 0f);
    }

    public void Draw(Texture2D texture, Vector2 position, Rectangle? sourceRectangle, Color color, float scale = 1f)
    {
        var origin = sourceRectangle.HasValue 
            ? new Vector2(sourceRectangle.Value.Width / 2f, sourceRectangle.Value.Height / 2f) 
            : new Vector2(0, 0);
        var destinationRectangle = sourceRectangle.HasValue
            ? new Rectangle((int)position.X, (int)position.Y, 
                (int)(sourceRectangle.Value.Width * scale), 
                (int)(sourceRectangle.Value.Height * scale))
            : new Rectangle((int)position.X, (int)position.Y, 
                (int)(texture.Width * scale), 
                (int)(texture.Height * scale));
        
        GetSpriteBatch().Draw(texture, destinationRectangle, sourceRectangle, color);
    }

    public void Dispose()
    {
        _spriteBatch?.Dispose();
        _spriteBatch = null;
    }
}
