using SMLanguage.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;

namespace SMLanguage
{
    public interface IAlertHandler
    {
        /// <summary>
        /// This is for user errors that wont pull the application down
        /// </summary>
        /// <param name="message"></param>
        void ShowUserError(string message);

        /// <summary>
        /// This is for showing exceptions, note the stack trace will show only in debug mode
        /// </summary>
        /// <param name="exception"></param>
        void ShowError(Exception exception);  

        void ShowWarning(string message);

        void ShowInfo(string message);
    }

    public class ConsoleAlertHandler : IAlertHandler
    {
        public void ShowUserError(string message)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine(message);
        }

        public void ShowError(Exception exception)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"{GameState.Instance.GetTitle()} errored! {exception.Message}");

            if (GameState.IsDebug())
            {
                Console.WriteLine(exception.StackTrace);
            }
        }

        public void ShowInfo(string message)
        {
            throw new NotImplementedException();
        }

        public void ShowWarning(string message)
        {
            throw new NotImplementedException();
        }
    }
}
