using Moq;
using NUnit.Framework;
using SMLanguage;
using SMLanguage.Exceptions;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class PlaceCharacterTests
    {
        [Test]
        public void GivenThatWeArePlaceingACharacter_InstructorWillPlaceThatCharacterInThatLocationAndScale()
        {
            //Arrange
            string command = "PLACE [Vaporwave] (30,30,30,90)";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.PlaceCharacter("Vaporwave", 30, 30, 30, 90));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.PlaceCharacter("Vaporwave", 30, 30, 30, 90));
            Assert.Equals("DrawImage", result.MethodName);
            Assert.Equals("Vaporwave", result.Parameters[0]);
            Assert.Equals(30, result.Parameters[1]);
            Assert.Equals(30, result.Parameters[2]);
            Assert.Equals(30, result.Parameters[3]);
            Assert.Equals(90, result.Parameters[4]);
        }

        [Test]
        public void GivenThatWeArePlaceingACharacterWith2Arguments_InstructorWillPlaceThatCharacterInThatLocation()
        {
            //Arrange
            string command = "PLACE [Vaporwave] (30,30-)";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.PlaceCharacter("Vaporwave", 30, 30, 0, 0));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.PlaceCharacter("Vaporwave", 30, 30, 0, 0));
            Assert.Equals("DrawImage", result.MethodName);
            Assert.Equals("Vaporwave", result.Parameters[0]);
            Assert.Equals(30, result.Parameters[1]);
            Assert.Equals(30, result.Parameters[2]);
        }

        [Test]
        public void GivenThatWeArePlaceingACharacterWithInvalidArguements_ThrowException()
        {
            //Arrange
            string command = "PLACE [Vaporwave] (390)";
            var instructor = new Mock<IStateManager>();
            var parser = new DirtyParser(instructor.Object);
            //Act
            Assert.Throws<ParserException>(() => parser.Parse(command));
        }

        [Test]
        public void GivenThatWeArePlaceingACharacterWithNoArguements_ThrowException()
        {
            //Arrange
            string command = "PLACE [Vaporwave]";
            var instructor = new Mock<IStateManager>();
            var parser = new DirtyParser(instructor.Object);
            //Act
            Assert.Throws<ParserException>(() => parser.Parse(command));
        }
    }
}
