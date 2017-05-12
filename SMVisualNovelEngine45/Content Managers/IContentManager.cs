namespace SMVisualNovelEngine45
{
    interface IContentManager
    {
        StandardImage CreateImage(string filePath, int top, int bottom, int right, int left, StandardImageCorner topLeft,
                                  StandardImageCorner topRight, StandardImageCorner bottomLeft,
                                  StandardImageCorner bottomRight);

    }
}
