import {constrain} from "../HelperFunctions";
import paper from "paper";
import * as settings from "../../Settings"
import {
    chainGrowSpeed,
    chainThickness,
    maxChainLength,
    maxChainThickness,
    minChainLength,
    minChainThickness
} from "../../Settings"
import AdultShape from "../AdultShape";
import {ChainConnector, ChainPoints, PathArray} from "../Interfaces";
import {start} from "node:repl";

export class Chain {
    a: AdultShape
    b: AdultShape

    aConnector?: paper.Path
    bConnector?: paper.Path

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

        if (this.chain)
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
        this._chain?.remove()
        this._chain = undefined
        this.lineArr.clearArr()
    }

    calcChainThickness() {
        const distance = this.a.position.subtract(this.b.position).length

        let calcThickness = (1 - (distance - minChainLength) / (maxChainLength - minChainLength)) * (maxChainThickness - minChainThickness) + minChainThickness
        calcThickness = constrain(calcThickness, minChainThickness, maxChainThickness)
        console.log(calcThickness)

        return calcThickness
    }

    getIntersections(shape: AdultShape, line: paper.Path) {
        const inter = line.getIntersections(shape.shape)
        if (inter.length > 0)
            return inter[0].point
        else
            return shape.position
    }

    getPoints(): ChainPoints {
        const line = new paper.Path.Line({
            from: this.a.position,
            to: this.b.position
        })

        const aStart = this.getIntersections(this.a, line)
        const bStart = this.getIntersections(this.b, line)

        return {start: aStart, end: bStart}
    }


    initConnectors() {
        const pts = this.getPoints()

        this.aConnector = new paper.Path.Line({
            from: pts.start,
            to: pts.start,
            strokeColor: this.a.color,
            strokeCap: 'round',
            strokeWidth: chainThickness
        })

        this.bConnector = new paper.Path.Line({
            from: pts.end,
            to: pts.end,
            strokeColor: this.b.color,
            strokeCap: 'round',
            strokeWidth: chainThickness
        })

    }

    growChain() {
        if (!this.aConnector! && !this.bConnector)
            this.initConnectors()

        const pts = this.getPoints()
        const diff = pts.end.subtract(pts.start)

        // if(diff.length > maxChainLength) return;

        const desired = diff.divide(2)

        const aDiff = desired.subtract(pts.start)
        const bDiff = desired.subtract(pts.end)

        this.aConnector!.firstSegment.point = pts.start
        this.bConnector!.firstSegment.point = pts.end

        if (this.aConnector!.length < aDiff.length) {
            const pt = new paper.Point({
                length: this.aConnector!.length + chainGrowSpeed,
                angle: aDiff.angle - this.a.rotation
            })

            this.aConnector!.lastSegment.point = this.aConnector!.firstSegment.point.add(pt)
        }

        if (this.bConnector!.length < bDiff.length) {
            const pt = new paper.Point({
                length: this.bConnector!.length + chainGrowSpeed,
                angle: bDiff.angle - this.b.rotation
            })

            this.bConnector!.lastSegment.point = this.bConnector!.firstSegment.point.add(pt)
        }

        if (this.aConnector!.length >= aDiff.length && this.bConnector!.length >= bDiff.length) {
            this.aConnector!.remove()
            this.bConnector!.remove()

            this.chain = new paper.Path.Line({
                from: pts.start,
                to: pts.end,
                strokeColor: this.avgColor,
                strokeCap: 'round',
                strokeWidth: chainThickness
            })

            this.aConnector = undefined
            this.bConnector = undefined

            return;
        }

    }

    genChain() {
        if (!this.chain) {
            this.growChain()
            return
        }

        const startPts = this.getPoints()
        this.chain = new paper.Path.Line({
            from: startPts.start,
            to: startPts.end,
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
        this.set.add(partner)
        this.genChains()
    }

    removePartner(partner: AdultShape) {
        this.set.delete(partner)
        this.genChains()
    }

    removeAll() {
        for (const chain of this.chainSet) {
            chain.remove()
        }

        this.chainSet.clear()
    }

    run() {
        for (const chain of this.chainSet) {
            chain.run()
        }
    }
}