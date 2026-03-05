using Moq;
using NUnit.Framework;
using SMLanguage;
using SMLanguage.Enums;
using SMLanguage.Exceptions;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class AddCharacterTests
    {
        [Test]
        public void Parse_WhenCharacterDoesNotExistAddCharacter()
        {
            // Arrange
            //TODO: Do we want to denote sprites with stars?
            var command = "Add [Sam Bridge The Elder] Happy *FadeIn*";
            var characterName = "Sam Bridge The Elder";

            var instructor = new Mock<IStateManager>();
            instructor.Setup(i=> i.AddCharacter(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeIn));
            var parser = new DirtyParser(instructor.Object);
            // Act
            var result = parser.Parse(command);
            // Assert
            instructor.Verify(i => i.AddCharacter(characterName, "Happy", Animation.FadeIn));
            Assert.Equals("DrawCharacter", result.MethodName);
            Assert.Equals(characterName, result.Parameters[0]);
            Assert.Equals("Happy", result.Parameters[1]);
            Assert.Equals(Animation.FadeIn, result.Parameters[2]);
        }

        [Test]
        public void Parse_WhenAnimationAndSpriteAreOutOfOrderThenDontAddCharacter()
        {
            // Arrange
            //TODO: Do we want to denote sprites with stars?
            var command = "Add [Sam Bridge The Elder] *FadeIn* Happy";


            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.AddCharacter(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeIn));
            var parser = new DirtyParser(instructor.Object);
            //Act + Assert
            Assert.Throws<ParserException>(() => parser.Parse(command));
        }
    }
}
