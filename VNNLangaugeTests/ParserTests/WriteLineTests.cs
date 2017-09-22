using NUnit.Framework;
using Moq;
using VNNLanguage;
using VNNLanguage.Exceptions;
using VNNMedia;

namespace VNNLangaugeTests
{
    [TestFixture]
    public class WriteLineTests
    {
        [Test]
        public void GivenTheSayCommandIsWithoutQuotes_ThenParserErrorShouldBeThrown()
        {
            //Arrange
            string command = "[Fucky The Dinosaur] SAYS I Like meat";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.WriteLine(It.IsAny<string>(), It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act & Assert
            Assert.Throws<ParserException>(() => parser.Parse(command));

        }

        [Test]
        public void GivenTinkyWinkySaysEhOh_ThenTheInstructorShouldRecieveWriteLineCommandWithExactTextAndCorrectCharacter()
        {
            //Arrange
            string command = "[Tinky Winky] SAYS \"Eh-oh\"";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.WriteLine(It.IsAny<string>(), It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.WriteLine("Eh-oh", "Tinky Winky"));
            Assert.AreEqual(true, result);

        }

        [Test]
        public void GivenTheSystemSaysYourBaseBelongsToUs_ThenTheInstructorShouldRecieveWriteLineCommandWithExactTextButNoCharacter()
        {
            //Arrange
            string command = "SAYS \"Your base belongs to us\"";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.WriteLine(It.IsAny<string>(), It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.WriteLine("Your base belongs to us", string.Empty));
            Assert.AreEqual(true, result);

        }

        [Test]
        public void GivenThatNothingIsSaidAtAll_ThenParserShouldThrowAParserError()
        {
            //Arrange
            string command = "[Ronan] SAYS ";
            var instructor = new Mock<IInstructor>();
            var parser = new DirtyParser(instructor.Object);
            //Act + Assert
            Assert.Throws<ParserException>(()=> parser.Parse(command));

        }

        [Test]
        public void GivenThatCommandHas2Says_ThenSecondSaysShouldBeDisplayInText()
        {
            //Arrange
            string command = "[Tutty Monster] SAYS \"Harveer says I like cheese!\"";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.WriteLine(It.IsAny<string>(), It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.WriteLine("Harveer says I like cheese!", "Tutty Monster"));
            Assert.AreEqual(true, result);
        }
    }
}
