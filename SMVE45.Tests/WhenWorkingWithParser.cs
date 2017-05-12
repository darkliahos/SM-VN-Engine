using System;
using System.IO;
using System.Reflection;
using SMVisualNovelEngine45;
using Xunit;

namespace SMVE45.Tests
{
    public class WhenWorkingWithParser
    {

        [Fact]
        public void LinesShouldBeStoredCorrectly()
        {
            //Note: This path needs to change otherwise tests will fail
            var instructionSet = new InstructionSet(Guid.Empty, "Fake", @"D:\VNProject\Visual Novel Engine\SMVisualNovelEngine45\SMVE45.Tests\Resources\fakelist.txt");

            instructionSet.ReadInstructionLineFromFile();

            Assert.Equal("Tada", instructionSet.InstructionLine[0]);
        }
    }
}
