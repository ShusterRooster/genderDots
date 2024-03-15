import GenderShape from "./shapeClasses";
import {project} from "paper";

export default class DotManager {
    static readonly minRadius: number = 15
    static readonly maxRadius: number = 100

    static readonly minVector: number = 5
    static readonly maxVector: number = 10

    static readonly minDistance: number = 25
    static readonly maxDistance: number = 1000

    static readonly baseScaleSpeed: number = 5

    static readonly minSize = this.minRadius * ((this.minRadius / 5) ** 2)
    static readonly maxSize = this.maxRadius ** 3

    static readonly genitalDiv: number = 5

    static readonly friction: number = 0.32
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


    //TODO get placing objects by distance working??
    sortByDist(){
        this.arr.sort((a, b) => a.distance < b.distance ? -1 : a.distance > b.distance ? 1 : 0)

        //run each dot once so they have a shape
        for (let i = 0; i < this.arr.length; i++) {
            this.arr[i].run()
        }

        for (let i = this.arr.length; i > 0 ; i--) {
            this.arr[i].shape.sendToBack()
        }


        console.log(this.arr)
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
            dot.run()
        }
    }
}