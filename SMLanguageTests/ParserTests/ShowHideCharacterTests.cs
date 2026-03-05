using Moq;
using NUnit.Framework;
using SMLanguage;
using SMLanguage.Enums;

namespace SMLanguageTests.ParserTests
{
    [TestFixture]
    public class ShowHideCharacterTests
    {
        [Test]
        public void GivenIHaveAHiddenCharacterAndWhenITypeShowThenTheCharacterShouldShow()
        {
            //Arrange
            string command = "Show [Jasmeet] *FadeIn*";
            var mockInstructor = new Mock<IStateManager>();
            mockInstructor.Setup(i => i.ShowCharacter("Jasmeet", Animation.FadeIn));
            var parser = new DirtyParser(mockInstructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            mockInstructor.Verify(i => i.ShowCharacter("Jasmeet", Animation.FadeIn));
            Assert.Equals("DrawImage", result.MethodName);
            Assert.Equals("Jasmeet", result.Parameters[0]);
            Assert.Equals(Animation.FadeIn, result.Parameters[1]);
        }

        [Test]
        public void GivenIHaveAVisibleCharacterAndWhenITypeShowThenTheCharacterShouldbeHidden()
        {
            //Arrange
            string command = "Hide [Jasmeet] *FadeOut*";
            var mockInstructor = new Mock<IStateManager>();
            mockInstructor.Setup(i => i.HideCharacter("Jasmeet", Animation.FadeOut));
            var parser = new DirtyParser(mockInstructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            mockInstructor.Verify(i => i.HideCharacter("Jasmeet", Animation.FadeOut));
            Assert.Equals("WipeImage", result.MethodName);
            Assert.Equals("Jasmeet", result.Parameters[0]);
            Assert.Equals(Animation.FadeOut, result.Parameters[1]);
        }
    }
}
