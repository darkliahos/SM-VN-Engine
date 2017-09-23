using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNNLanguage;
using VNNLanguage.Exceptions;
using VNNMedia;

namespace VNNLangaugeTests.ParserTests
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

            var instructor = new Mock<IInstructor>();
            var contentManager = new Mock<IContentManager>();
            instructor.Setup(i=> i.AddCharacter(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeIn));
            var parser = new DirtyParser(instructor.Object);
            // Act
            var result = parser.Parse(command);
            // Assert
            instructor.Verify(i => i.AddCharacter(characterName, "Happy", Animation.FadeIn));
            Assert.AreEqual(true, result);
        }

        [Test]
        public void Parse_WhenAnimationAndSpriteAreOutOfOrderThenDontAddCharacter()
        {
            // Arrange
            //TODO: Do we want to denote sprites with stars?
            var command = "Add [Sam Bridge The Elder] *FadeIn* Happy";


            var instructor = new Mock<IInstructor>();
            var contentManager = new Mock<IContentManager>();
            instructor.Setup(i => i.AddCharacter(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeIn));
            var parser = new DirtyParser(instructor.Object);
            //Act + Assert
            Assert.Throws<ParserException>(() => parser.Parse(command));
        }
    }
}
