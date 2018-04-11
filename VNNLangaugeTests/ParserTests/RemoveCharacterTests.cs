using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNNLanguage;
using VNNMedia;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class RemoveCharacterTests
    {
        [Test]
        public void GivenJonesIsRemoved_ThenTheInstructorShouldRemoveJones()
        {
            //Arrange
            string command = "Remove [Jones]";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.RemoveCharacter(It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.RemoveCharacter("Jones", Animation.FadeOut));
            Assert.AreEqual("WipeImage", result.MethodName);
            Assert.AreEqual("Jones", result.Parameters[0]);
            Assert.AreEqual(Animation.FadeOut, result.Parameters[1]);

        }

        [Test]
        public void GivenBastardBarretIsRemoved_ThenTheInstructorShouldRemoveBastardBarret()
        {
            //Arrange
            string command = "Remove [Bastard Barret]";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.RemoveCharacter(It.IsAny<string>(), Animation.FadeOut));
            var parser = new DirtyParser(instructor.Object);
            //Act
            var result = parser.Parse(command);
            //Assert
            instructor.Verify(i => i.RemoveCharacter("Bastard Barret", Animation.FadeOut));
            Assert.AreEqual("WipeImage", result.MethodName);
            Assert.AreEqual("Bastard Barret", result.Parameters[0]);
            Assert.AreEqual(Animation.FadeOut, result.Parameters[1]);

        }

    }
}
