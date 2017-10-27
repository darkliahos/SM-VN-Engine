using System;
using Autofac;
using VNNLanguage;

namespace VNNStart
{
    class Program
    {
        static void Main(string[] args)
        {
            var container = DiContainer.BuildContainer();
            var dirtyParser = container.Resolve<IParser>();

            if(dirtyParser.Parse("[Face] says \"hello\""))
            {
                Console.WriteLine("Great success");
            }

            Console.ReadLine();
        }
    }
}
