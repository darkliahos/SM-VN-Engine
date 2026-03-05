using NUnit.Framework;
using Moq;
using SMLanguage;
using SMLanguage.Exceptions;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class WriteLineTests
    {
        [Test]
        public void GivenTheSayCommandIsWithoutQuotes_ThenParserErrorShouldBeThrown()
        {
            //Arrange
            string command = "[Ducky The Dinosaur] SAYS I Like meat";
            var instructor = new Mock<IStateManager>();
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
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.CheckCharacterExists(It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.CheckCharacterExists("Tinky Winky"));
            Assert.Equals("WriteText", result.MethodName);
            Assert.Equals("Tinky Winky", result.Parameters[0]);
            Assert.Equals("Eh-oh", result.Parameters[1]);

        }

        [Test]
        public void GivenTheSystemSaysYourBaseBelongsToUs_ThenTheInstructorShouldRecieveWriteLineCommandWithExactTextButNoCharacter()
        {
            //Arrange
            string command = "SAYS \"Your base belongs to us\"";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.CheckCharacterExists(It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            Assert.Equals("WriteText", result.MethodName);
            Assert.Equals(string.Empty, result.Parameters[0]);
            Assert.Equals("Your base belongs to us", result.Parameters[1]);

        }

        [Test]
        public void GivenThatNothingIsSaidAtAll_ThenParserShouldThrowAParserError()
        {
            //Arrange
            string command = "[Ronan] SAYS ";
            var instructor = new Mock<IStateManager>();
            var parser = new DirtyParser(instructor.Object);
            //Act + Assert
            Assert.Throws<ParserException>(()=> parser.Parse(command));

        }

        [Test]
        public void GivenThatCommandHas2Says_ThenSecondSaysShouldBeDisplayInText()
        {
            //Arrange
            string command = "[Tutty Monster] SAYS \"Harveer says I like cheese!\"";
            var instructor = new Mock<IStateManager>();
            instructor.Setup(i => i.CheckCharacterExists(It.IsAny<string>()));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.CheckCharacterExists("Tutty Monster"));
            Assert.Equals("WriteText", result.MethodName);
            Assert.Equals("Tutty Monster", result.Parameters[0]);
            Assert.Equals("Harveer says I like cheese!", result.Parameters[1]);
        }
    }
}
