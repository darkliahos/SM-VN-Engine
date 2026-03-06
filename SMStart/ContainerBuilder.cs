using Autofac;
using SMContent;
using SMLanguage;

namespace SMStart
{
    public static class DiContainer
    {
        public static IContainer BuildContainer()
        {
            var builder = new ContainerBuilder();
            builder.RegisterType<DirtyParser>().As<IParser>();
            builder.RegisterType<StateManager>().As<IStateManager>();
            builder.RegisterType<PictureManager>().As<IPictureManager>();
            builder.RegisterType<ConsoleAlertHandler>().As<IAlertHandler>();
            return builder.Build();
        }
    }
}
