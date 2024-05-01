import GenderShape from "./shapeClasses";
import {PathArray} from "./HelperFunctions";
import paper from "paper";
import * as settings from "../Settings"

export class Chain {
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
        this.constrainMovement()
    }

    get chain(): paper.Path | undefined{
        return this._chain
    }

    set chain(chain: paper.Path){
        this._chain = chain
        this.chainArr.push(chain)
    }

    remove(){
        this.chain!.remove()
    }

    genChain(){
        if((this.a.ready && this.b.ready)){
            this.chain = new paper.Path.Line({
                from: this.a.position,
                to: this.b.position,
                strokeColor: this.color,
                strokeCap: 'round',
                strokeWidth: settings.chainThickness
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

    constrainMovement() {
        if(this.chain!.length > settings.maxChainLength){
            const center = this.a.position.subtract(this.b.position).divide(2)
            const aCenterDiff = center.subtract(this.a.position)
            const bCenterDiff = center.subtract(this.b.position)

            this.a.applyForce(aCenterDiff.divide(settings.chainMoveDiv * this.b.size))
            this.b.applyForce(bCenterDiff.divide(settings.chainMoveDiv * this.a.size))
        }

        else if(this.chain!.length < settings.minChainLength){
            const linePt = new paper.Point({
                angle: this.chain!.rotation,
                length: settings.minChainLength
            })

            const end = this.a.position.add(linePt)
            const bEndDiff = end.subtract(this.b.position)
            this.b.applyForce(bEndDiff.divide(this.b.size * settings.chainMoveDiv))
        }
    }
}


export class ChainWeb {
    arr: GenderShape[]
    chainArr: Chain[] = []

    constructor(arr: GenderShape[]) {
        this.arr = arr
        this.initChains()
    }

    removeAll(){
        for (const chain of this.chainArr) {
            chain.remove()
        }
    }

    run(){
        for (const chain of this.chainArr) {
            chain.run()
        }
    }

    initChains() {
        this.chainArr = []

        for (let i = 0; i < this.arr.length; i++) {
            const a = this.arr[i];

            for (let j = i + 1; j < this.arr.length - 1; j++) {
                const b = this.arr[j];

                const chain = new Chain(a, b)
                this.chainArr.push(chain)
            }
        }
    }
}