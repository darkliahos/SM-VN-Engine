using NUnit.Framework;
using Moq;
using SMLanguage;
using SMLanguage.Exceptions;
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
            string command = "[Ducky The Dinosaur] SAYS I Like meat";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.CheckCharacterExists(It.IsAny<string>()));
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
            instructor.Setup(i => i.CheckCharacterExists(It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.CheckCharacterExists("Tinky Winky"));
            Assert.AreEqual("WriteText", result.MethodName);
            Assert.AreEqual("Tinky Winky", result.Parameters[0]);
            Assert.AreEqual("Eh-oh", result.Parameters[1]);

        }

        [Test]
        public void GivenTheSystemSaysYourBaseBelongsToUs_ThenTheInstructorShouldRecieveWriteLineCommandWithExactTextButNoCharacter()
        {
            //Arrange
            string command = "SAYS \"Your base belongs to us\"";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.CheckCharacterExists(It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            Assert.AreEqual("WriteText", result.MethodName);
            Assert.AreEqual(string.Empty, result.Parameters[0]);
            Assert.AreEqual("Your base belongs to us", result.Parameters[1]);

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
            instructor.Setup(i => i.CheckCharacterExists(It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.CheckCharacterExists("Tutty Monster"));
            Assert.AreEqual("WriteText", result.MethodName);
            Assert.AreEqual("Tutty Monster", result.Parameters[0]);
            Assert.AreEqual("Harveer says I like cheese!", result.Parameters[1]);
        }
    }
}
