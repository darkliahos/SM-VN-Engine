using Moq;
using NUnit.Framework;
using NUnit.Framework.Internal;
using SMLanguage;
using SMLanguage.Enums;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class MoveCharacterTests
    {
        [Test]
        public void GivenThatWeAreMovingACharacterInOneDirection_InstructorWillMoveThatCharacterInThatDirection()
        {
            //Arrange
            string command = "MOVE [Ducky] 30px Left";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.RemoveCharacter(It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.MoveCharacter("Ducky", Direction.Left, 30));
            Assert.Equals("DrawImage", result.MethodName);
            Assert.Equals("Ducky", result.Parameters[0]);
            Assert.Equals(Direction.Left, result.Parameters[1]);
            Assert.Equals(30, result.Parameters[2]);
        }

        [Test]
        public void GivenThatWeAreChangingACharactersSprite_InstructorWillChangeThatCharacter()
        {
            //Arrange
            string command = "CHANGE SPRITE [Ducky] Sad *FadeOut*";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.ChangeCharacterSprite(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.ChangeCharacterSprite("Ducky", "Sad", Animation.FadeOut));
            Assert.Equals("DrawImage", result.MethodName);
            Assert.Equals("Ducky", result.Parameters[0]);
            Assert.Equals("Sad", result.Parameters[1]);
            Assert.Equals(Animation.FadeOut, result.Parameters[2]);
        }
    }
}
