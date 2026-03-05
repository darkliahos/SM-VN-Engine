using NUnit.Framework;
using Moq;
using SMLanguage;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class EndGameTests
    {
        [Test]
        public void GivenWeAreEndingThisStory_InstructorWillEndTheGame()
        {
            string command = "END STORY";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.GameOver());

            var parser = new DirtyParser(instructor.Object);

            var result = parser.Parse(command);

            instructor.Verify(i => i.GameOver());

            Assert.Equals("EndGame", result.MethodName);

        }
    }
}
