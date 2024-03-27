import GenderShape from "./shapeClasses";
import {Color} from "paper";
import {Quadtree} from "./QuadTree";
import paper from "paper";

export interface Sex {
    name: string,
    probability: number
}

export default class DotManager {
    /* Standard sex distribution data found here: https://www.ined.fr/en/everything_about_population/demographic-facts-sheets/faq/more-men-or-women-in-the-world.
    Data adjusted to mix in intersex population. Data found here https://ihra.org.au/16601/intersex-numbers/*/
    static readonly sexes: Sex[] = [
        {name: "male", probability: 48.7},
        {name: "female", probability: 47.9},
        {name: "intersex", probability: 1.7}]

    static readonly minRadius: number = 15
    static readonly maxRadius: number = 100

    static readonly minVector: number = 5
    static readonly maxVector: number = 10

    static readonly minDistance: number = 25
    static readonly maxDistance: number = 1000

    static readonly baseScaleSpeed: number = 7.5

    static readonly outerBoundsOffset: number = this.maxRadius * 4

    static readonly minSize = this.minRadius * ((this.minRadius / 5) ** 2)
    static readonly maxSize = this.maxRadius ** 3

    static readonly genitalDiv: number = 5

    static readonly maxForce: number = 1

    static readonly friction: number = 0.32
    static readonly normalForce: number = 1
    static readonly frictionMag: number = this.friction * this.normalForce

    arr: GenderShape[] = []
    numWanted: number | undefined
    quadTree: Quadtree | undefined
    outerBounds: paper.Rectangle

    constructor(numWanted?: number, quadTree?: Quadtree) {
        if(numWanted){
            this.numWanted = numWanted;
            this.initDots()
        }

        if(quadTree)
            this.quadTree = quadTree

        const view = paper.view.viewSize

        this.outerBounds = new paper.Rectangle({
            x: 0 - DotManager.outerBoundsOffset,
            y: 0 - DotManager.outerBoundsOffset,
            width: view.width + DotManager.outerBoundsOffset * 2,
            height: view.height + DotManager.outerBoundsOffset * 2
        })
    }

    initDots() {
        for (let i = 0; i < this.numWanted!; i++) {
            const shape = new GenderShape({dotManager: this})
            this.arr.push(shape);
            // this.quadTree?.insert(shape.shape)
        }

        for (let i = 0; i < this.arr.length; i++) {
            const a = this.arr[i]

            for (let j = i + 1; j < this.arr.length - 1; j++) {
                const b = this.arr[j]

                a.colorManager.calcAttraction(b)
            }


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

    get other(){
        return this.arr[Math.floor((Math.random() * this.arr.length))];
    }

    remove(shape: GenderShape){
        const index = this.arr.indexOf(shape)
        this.arr[index].shape.remove()
        this.arr.splice(index, 1)
    }

    update() {
        this.quadTree?.clear()

        for (const dot of this.arr) {
            dot.run()

            if(dot.collisionEnabled)
                this.quadTree?.insert(dot.shape)

        }
    }
}