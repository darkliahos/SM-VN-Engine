using Moq;
using NUnit.Framework;
using VNNLanguage;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class ShowHideCharacterTests
    {
        [Test]
        public void GivenIHaveAHiddenCharacterAndWhenITypeShowThenTheCharacterShouldShow()
        {
            //Arrange
            string command = "Show [Jasmeet] *FadeIn*";
            var mockInstructor = new Mock<IInstructor>();
            mockInstructor.Setup(i => i.ShowCharacter("Jasmeet", Animation.FadeIn));
            var parser = new DirtyParser(mockInstructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            Assert.AreEqual(true, result);
            mockInstructor.Verify(i => i.ShowCharacter("Jasmeet", Animation.FadeIn));
        }

        [Test]
        public void GivenIHaveAVisibleCharacterAndWhenITypeShowThenTheCharacterShouldbeHidden()
        {
            //Arrange
            string command = "Hide [Jasmeet] *FadeOut*";
            var mockInstructor = new Mock<IInstructor>();
            mockInstructor.Setup(i => i.HideCharacter("Jasmeet", Animation.FadeOut));
            var parser = new DirtyParser(mockInstructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            Assert.AreEqual(true, result);
            mockInstructor.Verify(i => i.HideCharacter("Jasmeet", Animation.FadeOut));
        }
    }
}
