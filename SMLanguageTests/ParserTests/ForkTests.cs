using Moq;
using NUnit.Framework;
using SMLanguage;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class ForkTests
    {
        [Test]
        public void GivenWeAreSettingAQuestion()
        {
            string command = "QUESTION \"Do you like cheese?\"";
            var instructor = new Mock<IStateManager>();

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            Assert.Equals("CHOICE SET QUESTION", result.MethodName);
            Assert.Equals("Do you like cheese?", result.Parameters[0]);

        }

        [Test]
        public void GivenWeAreSettingAChoice()
        {
            string command = "FORK \"Yes\"";
            var instructor = new Mock<IStateManager>();

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            Assert.Equals("ADD CHOICE", result.MethodName);
            Assert.Equals("Yes", result.Parameters[0]);

        }

    }
}
