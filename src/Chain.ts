import GenderShape from "./shapeClasses";
import DotManager from "./DotManager";
import {ChainConfig, PathArray} from "./HelperFunctions";
import paper from "paper";

export default class Chain {
    a: GenderShape
    b: GenderShape

    color: paper.Color
    protected _chain: paper.Path | undefined
    chainArr = new PathArray("chainArr")

    constructor(a: GenderShape, b: GenderShape) {
        this.a = a
        this.b = b
        this.color = a.relationship?.color ?? a.color
        this.genChain()
    }

    run(){
        this.genChain()
        this.constrain()
    }

    get chain(): paper.Path | undefined{
        return this._chain
    }

    set chain(chain: paper.Path){
        this._chain = chain
        this.chainArr.push(this.chain)
    }

    genChain(){
        if(this.a.ready && this.b.ready){
            this.chain = new paper.Path.Line({
                from: this.a.position,
                to: this.b.position,
                strokeColor: this.color,
                strokeCap: 'round'
            })
        }
    }

    getForces(){
        const aForce = this.a.vector!.length * this.a.size
        const bForce = this.b.vector!.length * this.b.size

        if(aForce > bForce)
            return {strong: this.a, weak: this.b}
        else
            return {strong: this.b, weak: this.a}
    }

    constrain(){
        if(this.chain != undefined){
            let mixedForce: paper.Point

            if(this.chain.length >= ChainConfig.maxChainLength){
                const forces = this.getForces()
                mixedForce = forces.strong.vector!.add(forces.weak.vector!)

                forces.weak.applyForce(forces.strong.vector)
                forces.strong.applyForce(forces.weak.vector)
            }

        }
    }
}


export class ChainWeb {
    arr: GenderShape[]
    chainArr: Chain[] = []

    constructor(arr: GenderShape[]) {
        this.arr = arr
        this.makeChains()
    }

    run(){
        for (const chain of this.chainArr) {
            chain.run()
        }
    }

    makeChains() {
        if(this.arr.length == 2){
            const chain = new Chain(this.arr[0], this.arr[1])
            this.chainArr.push(chain)
            return
        }

        for (let i = 0; i < this.arr.length; i++) {
            const a = this.arr[i];

            for (let j = i + 1; j < this.arr.length; j++) {
                const b = this.arr[j];

                const chain = new Chain(a, b)
                this.chainArr.push(chain)
            }
        }
    }
}