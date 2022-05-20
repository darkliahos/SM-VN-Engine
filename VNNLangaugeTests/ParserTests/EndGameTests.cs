﻿using NUnit.Framework;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNNLanguage;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class EndGameTests
    {
        [Test]
        public void GivenWeAreEndingThisStory_InstructorWillEndTheGame()
        {
            string command = "END STORY";
            var instructor = new Mock<IInstructor>();
            instructor.Setup(i => i.EndGame());

            var parser = new DirtyParser(instructor.Object);

            var result = parser.Parse(command);

            instructor.Verify(i => i.EndGame());

            Assert.AreEqual("EndGame", result.MethodName);

        }
    }
}