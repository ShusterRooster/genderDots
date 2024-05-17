# Welcome to the GenderDots Repo!

This project uses Parcel and TypeScript. Object creation and handling is done through **paper.js**. Run commands can be found in `package.json`.

## TODO:
* make it so that every shape processes a frame and then it is called at once by the manager??
* babies have relationships init?? or no?
* i can probably remove ColorManager
* fix chain color (just take the averages)
* fix chains connecting to multiple other shapes? make adultery a feature lol
* optimization ideas: 
  * path simplification
  * layering for babies vs adults
  * move complex shit out of the render loop
* fix run loops! optimize code time complexity
* clean up genital generation, fucking nasty
* fix transition from baby to adult as the pivot point is messed up, they jump when transitioning
* fix Relationship logic. lots of bugs are coming from the management of removing and adding partners, leaving unaddressed chains on screen or having shapes teleporting to NaN coords while seeking because the attractor is no longer in that relationship
* optimizations. idk how to optimize this shit but it gets laggy super quick.

* make drawing frames requested not always!

* more relationship types! once i get the logic for the other relationships worked out, hopefully i can bring back the unfinished merge and orbit types
* resize handling. chains are left on screen and the program freezes when the display is resized.
* device handling. need to figure out how to see if this is running on mobile or not. runs really slow on mobile and it needs there to be less dots on the screen. dots should also be smaller to accomodate screen sizes.
* interactivity? at the very least it would be just a refresh button that wipes the screen to make another instance.


## How this works:
Everything is started through the `main.ts` file which initializes and runs a ShapeManager instance. The ShapeManager handles a given set of dots and allows for the removal, addition, containing, etc. of the dots.

Upon running, the dots are paired up to be in relationships and once they're ready, meaning they are in their final forms, they will enter a relationship with dots that are decided by the program based off their attraction to one another.

In terms of future developments, the `seek()` functionality within the GenderShape class is quite buggy due to the dots teleporting once they go out of bounds. 

Code could definitely be optimized but given that this is my first large-ish scale project, I don't know what I'm doing. 

### **Feel free to leave suggestions but this project will not be maintained for very long and this repo is only public because I am using my repo through a CDN**
If you are interested in this project (for whatever reason) feel free to message me! :)

```
                               .,,uod8B8bou,,.
                      ..,uod8BBBBBBBBBBBBBBBBRPFT?l!i:.
                 ,=m8BBBBBBBBBBBBBBBRPFT?!||||||||||||||
                 !...:!TVBBBRPFT||||||||||!!^^""'   ||||
                 !.......:!?|||||!!^^""'            ||||
                 !.........||||                     ||||
                 !.........||||  ##                 ||||        compiter :3
                 !.........||||                     ||||
                 !.........||||                     ||||
                 !.........||||                     ||||
                 !.........||||                     ||||
                 `.........||||                    ,||||
                  .;.......||||               _.-!!|||||
           .,uodWBBBBb.....||||       _.-!!|||||||||!:'
        !YBBBBBBBBBBBBBBb..!|||:..-!!|||||||!iof68BBBBBb....
        !..YBBBBBBBBBBBBBBb!!||||||||!iof68BBBBBBRPFT?!::   `.
        !....YBBBBBBBBBBBBBBbaaitf68BBBBBBRPFT?!:::::::::     `.
        !......YBBBBBBBBBBBBBBBBBBBRPFT?!::::::;:!^"`;:::       `.
        !........YBBBBBBBBBBRPFT?!::::::::::^''...::::::;         iBBbo.
        `..........YBRPFT?!::::::::::::::::::::::::;iof68bo.      WBBBBbo.
          `..........:::::::::::::::::::::::;iof688888888888b.     `YBBBP^'
            `........::::::::::::::::;iof688888888888888888888b.     `
              `......:::::::::;iof688888888888888888888888888888b.
                `....:::;iof688888888888888888888888888888888899fT!
                  `..::!8888888888888888888888888888888899fT|!^"'
                    `' !!988888888888888888888888899fT|!^"'
                        `!!8888888888888888899fT|!^"'
                          `!988888888899fT|!^"'
                            `!9899fT|!^"'
                              `!^"'
```

##### coded by Julian Shuster, 2024