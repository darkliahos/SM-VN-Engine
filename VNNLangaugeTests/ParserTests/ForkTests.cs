using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SMLanguage;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class ForkTests
    {
        [Test]
        public void GivenWeAreSettingAQuestion()
        {
            string command = "QUESTION \"Do you like cheese?\"";
            var instructor = new Mock<IInstructor>();

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            Assert.AreEqual("CHOICE SET QUESTION", result.MethodName);
            Assert.AreEqual("Do you like cheese?", result.Parameters[0]);

        }

        [Test]
        public void GivenWeAreSettingAChoice()
        {
            string command = "FORK \"Yes\"";
            var instructor = new Mock<IInstructor>();

            var parser = new DirtyParser(instructor.Object);
            var result = parser.Parse(command);

            Assert.AreEqual("ADD CHOICE", result.MethodName);
            Assert.AreEqual("Yes", result.Parameters[0]);

        }

    }
}
