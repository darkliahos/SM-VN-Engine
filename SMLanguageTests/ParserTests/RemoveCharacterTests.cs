using Moq;
using NUnit.Framework;
using SMLanguage;
using SMLanguage.Enums;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class RemoveCharacterTests
    {
        [Test]
        public void GivenJonesIsRemoved_ThenTheInstructorShouldRemoveJones()
        {
            //Arrange
            string command = "Remove [Jones]";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.RemoveCharacter(It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.RemoveCharacter("Jones", Animation.FadeOut));
            Assert.Equals("WipeImage", result.MethodName);
            Assert.Equals("Jones", result.Parameters[0]);
            Assert.Equals(Animation.FadeOut, result.Parameters[1]);

        }

        [Test]
        public void GivenBastardBarretIsRemoved_ThenTheInstructorShouldRemoveBastardBarret()
        {
            //Arrange
            string command = "Remove [Bastard Barret]";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.RemoveCharacter(It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.RemoveCharacter("Bastard Barret", Animation.FadeOut));
            Assert.Equals("WipeImage", result.MethodName);
            Assert.Equals("Bastard Barret", result.Parameters[0]);
            Assert.Equals(Animation.FadeOut, result.Parameters[1]);

        }

    }
}
