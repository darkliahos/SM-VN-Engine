using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
