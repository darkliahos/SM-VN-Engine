using System.Text.RegularExpressions;

namespace VNNLanguage.Constants
{
    public static class RegexConstants
    {
        public static Regex CharacterNameRegex = new Regex(@"\[(.*?)\]");
        public static Regex GetStuffInQuotes = new Regex(@"\""(.*?)\""");
        public static Regex GetPixelValue = new Regex(@"[0-9]*\.?[0-9]+(px|%)?");
        public static Regex GetRoundBracketNumbers = new Regex(@"([0-9\.]+)");
    }
}
