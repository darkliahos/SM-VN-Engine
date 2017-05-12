using System;
using OpenTK;

namespace SMVisualNovelEngine45
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Starting Engine");
            MainWindow mw = new MainWindow();
            mw.SetEngine(30.0, VSyncMode.On);
            Console.ReadLine();

        }
    }
}
