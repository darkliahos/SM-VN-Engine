using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace VNNLanguage.Constants
{
    public static class RegexConstants
    {
        public static Regex CharacterNameRegex = new Regex(@"\[(.*?)\]");
        public static Regex GetStuffInQuotes = new Regex(@"\""(.*?)\""");
        public static Regex GetPixelValue = new Regex(@"[0-9]*\.?[0-9]+(px|%)?");
    }
}
