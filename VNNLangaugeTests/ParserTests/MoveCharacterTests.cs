using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SMLanguage;
using VNNMedia;
using SMLanguage.Enums;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class MoveCharacterTests
    {
        [Test]
        public void GivenThatWeAreMovingACharacterInOneDirection_InstructorWillMoveThatCharacterInThatDirection()
        {
            //Arrange
            string command = "MOVE [Ducky] 30px Left";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.RemoveCharacter(It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.MoveCharacter("Ducky", Direction.Left, 30));
            Assert.AreEqual("DrawImage", result.MethodName);
            Assert.AreEqual("Ducky", result.Parameters[0]);
            Assert.AreEqual(Direction.Left, result.Parameters[1]);
            Assert.AreEqual(30, result.Parameters[2]);
        }

        [Test]
        public void GivenThatWeAreChangingACharactersSprite_InstructorWillChangeThatCharacter()
        {
            //Arrange
            string command = "CHANGE SPRITE [Ducky] Sad *FadeOut*";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.ChangeCharacterSprite(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.ChangeCharacterSprite("Ducky", "Sad", Animation.FadeOut));
            Assert.AreEqual("DrawImage", result.MethodName);
            Assert.AreEqual("Ducky", result.Parameters[0]);
            Assert.AreEqual("Sad", result.Parameters[1]);
            Assert.AreEqual(Animation.FadeOut, result.Parameters[2]);
        }
    }
}
