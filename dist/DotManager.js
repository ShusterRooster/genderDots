import GenderShape from "./shapeClasses.src";
export default class DotManager {
    static minRadius = 15;
    static maxRadius = 100;
    static minVector = 5;
    static maxVector = 25;
    static minScaleSpeed = 0.25;
    static maxScaleSpeed = 10;
    static minDistance = 25;
    static genitalDiv = 5;
    static friction = 0.1;
    static normalForce = 1;
    static frictionMag = this.friction * this.normalForce;
    arr;
    numWanted;
    constructor(numWanted) {
        this.numWanted = numWanted;
        for (let i = 0; i < numWanted; i++) {
            const shape = new GenderShape(this);
            this.arr.push(shape);
        }
        console.log(`dotManager: ${this.arr}`);
    }
    createTestShape(shape) {
        if (!shape)
            this.arr.push(new GenderShape(this));
        else
            this.arr.push(shape);
    }
    initDots() {
        for (let i = 0; i < this.numWanted; i++) {
            const shape = new GenderShape(this);
            this.arr.push(shape);
        }
        console.log(`dotManager: ${this.arr}`);
    }
    *iterator() {
        for (const shape in this.arr) {
            yield shape;
        }
    }
    checkCollision() {
        const iter = this.iterator();
        for (const item in iter) {
            console.log(item);
        }
        // try {
        //     if (a.shape !== undefined && b.shape !== undefined) {
        //         // Compare object1 with object2
        //         if (a.shape.intersects(b.shape)) {
        //             a.collisionDetected()
        //             b.collisionDetected()
        //         }
        //     }
        // } catch {
        //     //???
        // }
    }
    update() {
        for (let i = 0; i < this.arr.length; i++) {
            const dot = this.arr[i];
            dot.moveTowardScreen();
            if (dot.collisionEnabled)
                this.checkCollision();
        }
    }
}
