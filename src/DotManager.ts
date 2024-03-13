import GenderShape from "./shapeClasses";

export default class DotManager {
    static readonly minRadius: number = 15
    static readonly maxRadius: number = 100

    static readonly minVector: number = 5
    static readonly maxVector: number = 25

    static readonly minScaleSpeed: number = 0.25
    static readonly maxScaleSpeed: number = 10

    static readonly minDistance: number = 25

    static readonly genitalDiv: number = 5

    static readonly friction: number = 0.1
    static readonly normalForce: number = 1
    static readonly frictionMag: number = this.friction * this.normalForce

    arr: GenderShape[] = []
    numWanted: number

    constructor(numWanted: number) {
        this.numWanted = numWanted;
        this.initDots()
    }

    createTestShape(shape?: GenderShape) {
        if (!shape)
            this.arr.push(new GenderShape(this));
        else
            this.arr.push(shape);
    }

    initDots() {
        for (let i = 0; i < this.numWanted; i++) {
            const shape = new GenderShape(this)
            this.arr.push(shape);
        }

        console.log(`dotManager: ${this.arr}`)
    }

    * iterator() {
        for (const shape in this.arr) {
            yield shape
        }
    }

    checkCollision() {
        const iter = this.iterator()

        for (const item in iter) {
            console.log(item)
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