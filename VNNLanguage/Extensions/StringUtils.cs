using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VNNLanguage.Extensions
{
    public static class StringUtils
    {
        /// <summary>
        /// Allows you to do a contains without having to worry about case
        /// </summary>
        /// <param name="input">The string you are checking</param>
        /// <param name="value">What are you checking for</param>
        /// <param name="stringComparison">If you want to include case, culture variance, etc, this is set to current culture ignore case by default</param>
        /// <returns></returns>
        public static bool ContainsInsensitive(this string input, string value, StringComparison stringComparison = StringComparison.CurrentCultureIgnoreCase)
        {
            return input.IndexOf(value, stringComparison) >= 0;
        }
    }
}
