import GenderShape from "./shapeClasses.js";

export default class DotManager {
    static minRadius = 15
    static maxRadius = 100

    static minVector = 5
    static maxVector = 25

    static minScaleSpeed = 0.25
    static maxScaleSpeed = 10

    static minDistance = 25

    static genitalDiv = 5

    static friction = 0.1
    static normalForce = 1
    static frictionMag = this.friction * this.normalForce

    constructor(numWanted) {
        this.arr = [];
        this.numWanted = numWanted;

        this.initDots()
    }

    createTestDot(dot) {
        this.arr.push(dot);
    }

    initDots() {
        for (let i = 0; i < this.numWanted; i++) {
            const shape = new GenderShape(this)
            this.arr.push(shape);
        }

        console.log(this.arr)
    }

    * nestLoop() {
        for (let i = 0; i < this.arr.length; i++) {
            for (let j = i + 1; j < this.arr.length; j++) {
                yield {a: this.arr[i], b: this.arr[j]}
            }
        }
    }

    checkCollision() {
        const a = this.nestLoop().a
        const b = this.nestLoop().b

        try {
            if (a.shape !== undefined && b.shape !== undefined) {
                // Compare object1 with object2
                if (a.shape.intersects(b.shape)) {
                    a.collisionDetected()
                    b.collisionDetected()
                }
            }
        } catch {
            //???
        }


    }

    update() {
        for (let i = 0; i < this.arr.length; i++) {
            const dot = this.arr[i]
            dot.moveTowardScreen()

            if (dot.collisionEnabled)
                this.checkCollision()
        }
    }
}