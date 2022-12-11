﻿using Moq;
using NUnit.Framework;
using SMLanguage;
using SMLanguage.Enums;
using SMLanguage.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VNNMedia;

namespace VNNLangaugeTests.ParserTests
{
    [TestFixture]
    public class AddCharacterTests
    {
        [Test]
        public void Parse_WhenCharacterDoesNotExistAddCharacter()
        {
            // Arrange
            //TODO: Do we want to denote sprites with stars?
            var command = "Add [Sam Bridge The Elder] Happy *FadeIn*";
            var characterName = "Sam Bridge The Elder";

            var instructor = new Mock<IStateManager>();
            var contentManager = new Mock<IContentManager>();
            instructor.Setup(i=> i.AddCharacter(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeIn));
            var parser = new DirtyParser(instructor.Object);
            // Act
            var result = parser.Parse(command);
            // Assert
            instructor.Verify(i => i.AddCharacter(characterName, "Happy", Animation.FadeIn));
            Assert.AreEqual("DrawCharacter", result.MethodName);
            Assert.AreEqual(characterName, result.Parameters[0]);
            Assert.AreEqual("Happy", result.Parameters[1]);
            Assert.AreEqual(Animation.FadeIn, result.Parameters[2]);
        }

        [Test]
        public void Parse_WhenAnimationAndSpriteAreOutOfOrderThenDontAddCharacter()
        {
            // Arrange
            //TODO: Do we want to denote sprites with stars?
            var command = "Add [Sam Bridge The Elder] *FadeIn* Happy";


            var instructor = new Mock<IStateManager>();
            var contentManager = new Mock<IContentManager>();
            instructor.Setup(i => i.AddCharacter(It.IsAny<string>(), It.IsAny<string>(), Animation.FadeIn));
            var parser = new DirtyParser(instructor.Object);
            //Act + Assert
            Assert.Throws<ParserException>(() => parser.Parse(command));
        }
    }
}
