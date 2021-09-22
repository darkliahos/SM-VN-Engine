using Moq;
using NUnit.Framework;
using VNNLanguage;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class PlaySoundTests
    {
        [Test]
        public void GivenThatWeArePlayingANonLoopedSound()
        {
            string command = "PLAY SOUND \"X.wav\"";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.PlaySound(It.IsAny<string>(), It.IsAny<bool>()));

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            instructor.Verify(i => i.PlaySound("X.wav", false));

            Assert.AreEqual("PLAY SOUND", result.MethodName);
            Assert.AreEqual("X.wav", result.Parameters[0]);
            Assert.AreEqual(false, result.Parameters[1]);

        }

        [Test]
        public void GivenThatWeArePlayingALoopedSound()
        {
            string command = "PLAY SOUND LOOP \"X.wav\"";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.PlaySound(It.IsAny<string>(), It.IsAny<bool>()));

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            instructor.Verify(i => i.PlaySound("X.wav", true));

            Assert.AreEqual("PLAY SOUND", result.MethodName);
            Assert.AreEqual("X.wav", result.Parameters[0]);
            Assert.AreEqual(true, result.Parameters[1]);

        }
    }
}
