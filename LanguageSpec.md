# Language Spec

This is very much in draft at the moment, until this has been implemented in the Visual Novel Engine, expect this to change at short notice

## Version history

v0.01 - Sohail Nasir - Initial draft of the language for the engine

v0.02 - Sohail Nasir - Changed Remove character to make a bit more sense

v0.03 - Sohail Nasir - Refined syntax following discussions

v0.04 - Sohail Nasir - Forking a bit more defined and some typos are fixed.

v0.05 - Sohail Nasir - Added positionsing

## Purpose of this document

To allow for discussion of what this language should be

## Terms

Scene - What is currently displaying on screen

Scope - What is living in memory whether or not its displayed or not

Character - An object that represents the character, this is the character metadata, sprites

## Design goals

Language should be easy for someone who is not technical to write, It should use verbose and easy to explain syntax.


## Language Features

In order to define a character, they must be surrounded by brackets like this: 

```[Character Name here]```

### Writing a line

```[Character] SAYS [Whatever]```

So an example of this is if we had a character called Alanis and Alanis said hello, we would write it like this:

```[Alanis] SAYS hello```

We would identifiy anything before Says as the character name, anything after says would be what we would want to attribute to the character

If you don't want a character or maybe if you wanted to create a system level message, you could easily write

`Says hello

The Language would infer the lack of the character in this scenario would be a system level message

### Lack of a character in scope

If Debug throw an error, if final release then show sillouette to player. 

### Adding Character to scene

```Add [Character] [Sprite] *[Animation]* ([position])```

So an example of this would if we had a character called Alanis and we wanted to add Alanis to the scene and wanted to use an already created sprite with a fade in animation, we can do that with a line like this

```Add [Alanis] Happy *Fade In* (left)```

So for the sprite "Happy" would be defined in a folder with the character name and with an image called "Happy.png"

The Fade in would be a prebuilt animation

### Removing a character from the scene

There are two ways to remove a character from the scene

For something temporary, ie: you are hiding the character for a little while maybe you have other characters on the screen or for dramatic effect.

```Hide [Character] *[Animation]*```

So if you wanted to hide a character called Alanis

```Hide [Alanis] *Fade Out*```

If we want to bring back the character without having the readding the character 

We can just use 

```Show [Character] *[Animation]* ([position])```

So for our example of Alanis, we could write: 

```Show [Alanis] *Fade In* (Centre)```

A more permanant route, if we want to completely remove the character out of the scene, we can do:

```Remove [Character]```

So if we wanted to completely remove Alanis:

```Remove [Alanis]```

### Changing Character Sprite

The engine for the time being will use tweening, the sprite must exist in the character folder with the name of the sprite.

```CHANGE SPRITE [Character] [Sprite] *[Animation]*```

So if we wanted to change Alanis's sprite to sad.png, we would use 

```CHANGE SPRITE [Alanis] Sad *Swizzle*```

### Moving Character

There are two ways of moving a character around the screen, one if we just want to move them along in one direction

```MOVE [Character] [Number of Pixels]px [Direction]]```

So it would be:

```MOVE [Alanis] 40px Left```

### Place Character

If we wanted to move the character sprite anywhere on the screen with scaling, we could just type

```PLACE [Character] ([x, y, Scale-Height, Scale-Width, position])```

So if we were to place Alanis in the top left corner of the screen at 50px height and 20px width, we would write

```PLACE [Alanis] (0,0,50,20, right)```

If we did not want to worry about scaling we could just write:

```PLACE [Alanis] (0,0, right)```

###Checking if the Character exists

So if we need check if the character is on the scene or even in the background, we can use this character

```Is [Character] In scene?```

So it could be

 ```Is [Alanis] In scene?```

### Jump Scenario

Jumping scenario allows us to jump from one place to another in the story, so long as the scenario is declared somewhere in the script file.

To Declare a scenario, we can type:

```BEGIN SCENARIO "[Scenario Name]"```

So an example of this will be:

```BEGIN SCENARIO "Down by the bay"```

So to jump to a scenario it would just be:

```JUMP [Scenario]``` or ```JUMP "Down by the bay"```

### Forking

Forking allows for multiple scenarios in a scene, they can be small diversions which merge into a story branch or for more complex branching can transfer to other scenes or even end the game all together. 

Forking can be written with scenarios embedded inside of a forking statment, however this can result in spaghetti code but good for beginners or they can be written to point to scenarios.

So if we had a fork in which we needed the user to make a decision and execute scenarios based on what the user decided then we come up with this:

```
[Alanis] SAYS "Would you like cheese?"
BEGIN CHOICES
FORK "I love cheese"
JUMP "SCENARIO 1"
FORK "No way, I am a married man"
JUMP "SCENARIO 2"
BEGIN FORK "Ask me later"
JUMP "SCENARIO 3"
END CHOICES
```
This will be limited to 4 forks for the time being however if advances are made and there is a demand than it could be increased. 

### Background Management

Every scene will always have a background of sorts, by default if a background is not set then the scene will just assume a blackground in order to set a background for the scene. The backgrounds will be stored in a folder and the naming of the background will just assume the file name, so in order to change it it will be a case of calling the change the background command like this:

```CHANGE BACKGROUND [background name]```

So if we have background called face.png, the command will be

```CHANGE BACKGROUND Face```

### Sound

Sound still is somewhat not defined yet, so far some thoughts are 

```PLAY "Some.wav"```

### Ending Game

If the game needs to end, ie: the user has finished the game or for effect you just feel like kicking the user, then it is a case of just writing:

```END STORY```

# Implementations

| Feature       | Dirty Parser  |
| ------------- | ------------- |
| Writing a line | :heavy_check_mark:  |
| Character Add  |  :heavy_check_mark:   |
| Character Remove  |  :heavy_check_mark:   |
| Character Change Sprite  |  :x:   |
| Character Hide  |  :heavy_check_mark:   |
| Character Show  |  :heavy_check_mark:   |
| Character Move  |  :heavy_check_mark:   |
| Character Place  |  :heavy_check_mark:   |
| Jump Scenario  |  :heavy_check_mark:   |
| Change Background  |  :heavy_check_mark:   |
| Forking  |  :x:   |
| Sound  |  :x:   |
| Ending game  |   :heavy_check_mark:   |
