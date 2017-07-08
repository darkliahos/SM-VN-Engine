#Language Spec

This is very much in draft at the moment, until this has been implemented in the Visual Novel Engine, expect this to change at short notice

##Purpose of this document

To allow for discussion of what this language should be

##Terms

Scene - What is currently displaying on screen

Scope - What is living in memory whether or not its displayed or not

Character - An object that represents the character, this is the character metadata, sprites

##Design goals

Language should be easy for someone who is not technical to write, It should use verbose and easy to explain syntax.


##Language Features

###Writing a line 

```[Character] says [Whatever]```

So an example of this is if we had a character called Alanis and Alanis said hello, we would write it like this:

```Alanis Says hello```

We would identifiy anything before Says as the character name, anything after says would be what we would want to attribute to the character

If you don't want a character or maybe if you wanted to create a system level message, you could easily write

`Says hello

The Language would infer the lack of the character in this scenario would be a system level message

####Lack of a character in scope:

TODO:// DISCUSS 

Maybe we throw an error if the character does not exist or display a silioute (?)

###Adding Character to scene

```Add [Character] *[Sprite]* [Animation]```

So an example of this would if we had a character called Alanis and we wanted to add Alanis to the scene and wanted to use an already created sprite with a fade in animation, we can do that with a line like this

```Add Alanis *Happy* Fade In```

So for the sprite "Happy" would be defined in a folder with the character name and with an image called "Happy.png"

The Fade in would be a prebuilt animation

###Removing a character from the scene

There are two ways to remove a character from the scene

For something temporary, ie: you are hiding the character for a little while maybe you have other characters on the screen or for dramatic effect.

```Hide [Character] [Animation]```

So if you wanted to hide a character called Alanis

```Hide Alanis Fade Out```

If we want to bring back the character without having the readd the character 

We can just use 

```Show [Character] [Animation]```

So for our example of Alanis, we could write: 

```Add Alanis Fade In```

A more permanant route, if we want to completely the character out of the scene, we can do 

```Remove [Character] [Animation]```

So if we wanted to completely remove Alanis 

```Remove Alanis Fade Out```

###Changing Character Sprite

###Moving Character

###Checking if the Character exists

###Forking

###Jump Line

###Background Management

###Sound

###Ending Game

