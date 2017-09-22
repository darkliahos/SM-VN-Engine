using Moq;
using NUnit.Framework;
using VNNLanguage;
using VNNLanguage.Exceptions;
using VNNMedia;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class PlaceCharacterTests
    {
        [Test]
        public void GivenThatWeArePlaceingACharacter_InstructorWillPlaceThatCharacterInThatLocationAndScale()
        {
            //Arrange
            string command = "PLACE [Vaporwave] (30,30,30,90)";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.PlaceCharacter("Vaporwave", 30, 30, 30, 90));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.PlaceCharacter("Vaporwave", 30, 30, 30, 90));
            Assert.AreEqual(true, result);
        }

        [Test]
        public void GivenThatWeArePlaceingACharacterWith2Arguments_InstructorWillPlaceThatCharacterInThatLocation()
        {
            //Arrange
            string command = "PLACE [Vaporwave] (30,30-)";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.PlaceCharacter("Vaporwave", 30, 30, 0, 0));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.PlaceCharacter("Vaporwave", 30, 30, 0, 0));
            Assert.AreEqual(true, result);
        }

        [Test]
        public void GivenThatWeArePlaceingACharacterWithInvalidArguements_ThrowException()
        {
            //Arrange
            string command = "PLACE [Vaporwave] (390)";
            var instructor = new Mock<IInstructor>();
            var parser = new DirtyParser(instructor.Object);
            //Act
            Assert.Throws<ParserException>(() => parser.Parse(command));
        }

        [Test]
        public void GivenThatWeArePlaceingACharacterWithNoArguements_ThrowException()
        {
            //Arrange
            string command = "PLACE [Vaporwave]";
            var instructor = new Mock<IInstructor>();
            var parser = new DirtyParser(instructor.Object);
            //Act
            Assert.Throws<ParserException>(() => parser.Parse(command));
        }
    }
}
