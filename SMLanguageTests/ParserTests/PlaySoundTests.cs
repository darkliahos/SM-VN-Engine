using Moq;
using NUnit.Framework;
using SMLanguage;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class PlaySoundTests
    {
        [Test]
        public void GivenThatWeArePlayingANonLoopedSound()
        {
            string command = "PLAY SOUND \"X.wav\"";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.PlaySound(It.IsAny<string>(), It.IsAny<bool>()));

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            instructor.Verify(i => i.PlaySound("X.wav", false));

            Assert.Equals("PLAY SOUND", result.MethodName);
            Assert.Equals("X.wav", result.Parameters[0]);
            Assert.Equals(false, result.Parameters[1]);

        }

        [Test]
        public void GivenThatWeArePlayingALoopedSound()
        {
            string command = "PLAY SOUND LOOP \"X.wav\"";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.PlaySound(It.IsAny<string>(), It.IsAny<bool>()));

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            instructor.Verify(i => i.PlaySound("X.wav", true));

            Assert.Equals("PLAY SOUND", result.MethodName);
            Assert.Equals("X.wav", result.Parameters[0]);
            Assert.Equals(true, result.Parameters[1]);

        }
    }
}
