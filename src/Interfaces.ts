import paper from "paper";
import ShapeManager from "./ShapeManager";

export interface Probability {
    name: string,
    probability: number
}

export class PathArray {
    name: string
    arr: paper.Path[]
    cleanDist: number

    constructor(name: string, cleanDist = 1) {
        this.name = name
        this.arr = []
        this.cleanDist = cleanDist
    }

    push(...args: any[]) {
        args.forEach((arg) => {
            this.arr.push(arg)
        })

        this.scrubArr()
    }

    //deletes everything but last element in array unless specified otherwise
    scrubArr() {
        const len = this.arr.length

        if (len > this.cleanDist) {
            for (let i = 0; i < len - this.cleanDist; i++) {
                this.arr[i].remove()
            }
        }

        this.arr = this.arr.slice(len - this.cleanDist)
    }

    clearArr() {
        for (const path of this.arr) {
            path.remove()
        }
    }

    print(text?: string) {
        if (text)
            console.log(`${text}, ${this.name}: ${this.arr}`)
        else
            console.log(`${this.name}: [${this.arr}]`)
    }
}

export interface babyShape {
    dotManager?: ShapeManager;
    spawnPoint?: paper.Point;
    radius?: number;
    distance?: number;
    sex?: string;
    genitalWidth?: number;
    genitalEndHeight?: number;
    color?: paper.Color;
}