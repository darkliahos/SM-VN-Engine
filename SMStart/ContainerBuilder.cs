using Autofac;
using SMLanguage;
//using VNNMedia;

namespace SMStart
{
    public static class DiContainer
    {
        private static IContainer container { get; set; }

        public static IContainer BuildContainer()
        {
            var builder = new ContainerBuilder();
            builder.RegisterType<DirtyParser>().As<IParser>();
            builder.RegisterType<StateManager>().As<IStateManager>();
            //builder.RegisterType<ContentManager>().As<IContentManager>();
            builder.RegisterType<ConsoleAlertHandler>().As<IAlertHandler>();
            return builder.Build();
        }
    }
}
