using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpenTK;

namespace SMVisualNovelEngine45
{
    class MainWindow
    {
        public void SetEngine(double frameRate, VSyncMode vSyncToggler)
        {
            try
            {
                using (GLWindow windowX = new GLWindow())
                {
                    windowX.VSync = vSyncToggler;
                    windowX.BackgroundColor = Color.Black;
                    windowX.Title = frameRate + " FPS";
                    Console.WriteLine("Running at " +frameRate + " FPS");
                    windowX.Run(frameRate);
                }
            }
            catch (Exception error)
            {
               //Some Logging here
                Console.WriteLine("ERROR: "+ error);
            }

        }
    }
}
