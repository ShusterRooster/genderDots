import {constrain} from "./HelperFunctions";
import paper from "paper";
import * as settings from "../Settings"
import {chainThickness, maxChainLength, maxChainThickness, minChainLength, minChainThickness} from "../Settings"
import AdultShape from "./AdultShape";
import {PathArray} from "./Interfaces";

export class Chain {
    a: AdultShape
    b: AdultShape


    avgColor: paper.Color
    protected _chain: paper.Path | undefined
    lineArr = new PathArray("lineArr")

    constructor(a: AdultShape, b: AdultShape) {
        this.a = a
        this.b = b
        this.avgColor = this.a.color.add(this.b.color).divide(2)
    }

    run() {
        this.genChain()
        this.constrainMovement()
    }

    get chain(): paper.Path | undefined {
        return this._chain
    }

    set chain(chain: paper.Path) {
        this._chain = chain
        this.lineArr.push(chain)
    }

    remove() {
        this.chain?.remove()
        this.lineArr.clearArr()
    }

    calcChainThickness() {
        const distance = this.a.position.subtract(this.b.position).length

        let calcThickness = (1 - (distance - minChainLength) / (maxChainLength - minChainLength)) * (maxChainThickness - minChainThickness) + minChainThickness
        calcThickness = constrain(calcThickness, minChainThickness, maxChainThickness)
        console.log(calcThickness)

        return calcThickness
    }

    genChain() {
        this.chain = new paper.Path.Line({
            from: this.a.position,
            to: this.b.position,
            strokeColor: this.avgColor,
            strokeCap: 'round',
            strokeWidth: chainThickness
        })
    }

    centerOfMass() {
        const totalMass = this.a.size + this.b.size
        const centerX = (this.a.size * this.a.position.x + this.b.size * this.b.position.x) / totalMass
        const centerY = (this.a.size * this.a.position.y + this.b.size * this.b.position.y) / totalMass

        return new paper.Point(centerX, centerY)
    }

    constrainMovement() {
        if (this.chain!.length > settings.maxChainLength) {
            const centerMass = this.centerOfMass()

            // const center = this.a.position.subtract(this.b.position).divide(2)
            const aCenterDiff = centerMass.subtract(this.a.position)
            const bCenterDiff = centerMass.subtract(this.b.position)

            this.a.applyForce(aCenterDiff.divide(settings.chainMoveDiv * this.b.size))
            this.b.applyForce(bCenterDiff.divide(settings.chainMoveDiv * this.a.size))
        } else if (this.chain!.length < settings.minChainLength) {
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
    set: Set<AdultShape>
    chainSet = new Set<Chain>()

    constructor(set: Set<AdultShape>) {
        this.set = set
        this.genChains()
    }

    genChains() {
        this.removeAll()

        const arr = Array.from(this.set)

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                const chain = new Chain(a, b)
                this.chainSet.add(chain)
            }
        }
    }

    addPartner(partner: AdultShape) {
        this.removeAll()
        this.set.add(partner)
        this.genChains()
    }

    removePartner(partner: AdultShape) {
        this.set.delete(partner)
        this.removeAll()
        this.genChains()
    }

    removeAll() {
        for (const chain of this.chainSet) {
            chain.remove()
        }
    }

    run() {
        for (const chain of this.chainSet) {
            chain.run()
        }
    }
}