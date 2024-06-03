import {constrain} from "../HelperFunctions";
import paper from "paper";
import * as settings from "../../Settings"
import {
    chainGrowSpeed,
    chainShrinkDelay,
    chainShrinkSpeed,
    chainThickness,
    maxChainLength,
    maxChainThickness,
    minChainLength,
    minChainThickness
} from "../../Settings"
import AdultShape from "../AdultShape";
import {ChainPoints, PathArray} from "../Interfaces";

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
        if (!this.chain) {
            this.grow()
        } else {
            this.update()
        }
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

        line.remove()
        return {start: aStart, end: bStart}
    }

    initConnectors() {
        this.aConnector = new paper.Path.Line({
            from: this.a.position,
            to: this.a.position,
            strokeColor: this.a.color,
            strokeCap: 'round',
            strokeWidth: chainThickness
        })

        this.bConnector = new paper.Path.Line({
            from: this.b.position,
            to: this.b.position,
            strokeColor: this.b.color,
            strokeCap: 'round',
            strokeWidth: chainThickness
        })
    }

    calcPoint(connector: paper.Path, diff: paper.Point, behavior: string) {
        let growVal: number

        if (behavior == "grow")
            growVal = chainGrowSpeed
        else if (behavior == "shrink")
            growVal = -chainGrowSpeed
        else
            growVal = 0

        return new paper.Point({
            length: connector.length + growVal,
            angle: diff.angle
        })
    }

    connectorsExist() {
        return this.aConnector !== undefined && this.bConnector !== undefined
    }

    eitherOutOfBounds() {
        return this.a.outOfBounds() || this.b.outOfBounds()
    }

    shrinkConnectors(a: paper.Path, b: paper.Path, clone = true) {
        if (clone) {
            a = a.clone()
            b = b.clone()
        }

        if (a.length > chainGrowSpeed) {
            const diff = a.lastSegment.point.subtract(a.firstSegment.point)

            const calc = new paper.Point({
                length: a.length - chainShrinkSpeed,
                angle: diff.angle
            })

            a.lastSegment.point = calc.add(a.firstSegment.point)
        }
        else {
            a.remove()
        }

        if (b.length > chainGrowSpeed) {
            const diff = b.lastSegment.point.subtract(b.firstSegment.point)

            const calc = new paper.Point({
                length: b.length - chainShrinkSpeed,
                angle: diff.angle
            })

            b.lastSegment.point = calc.add(b.firstSegment.point)
        }
        else {
            b.remove()
        }

        setTimeout(() => this.shrinkConnectors(a, b, false), chainShrinkDelay)
    }

    grow() {
        if (this.connectorsExist() && this.eitherOutOfBounds()) {
            this.shrinkConnectors(this.aConnector!, this.bConnector!)
            return
        }

        if (!this.connectorsExist() && !this.eitherOutOfBounds()) {
            this.initConnectors()
        }

        const startPts = this.getPoints()
        const desired = startPts.start.add(startPts.end).divide(2)
        const aDiff = desired.subtract(startPts.start)
        const bDiff = desired.subtract(startPts.end)

        this.aConnector!.firstSegment.point = startPts.start
        this.bConnector!.firstSegment.point = startPts.end

        if (this.aConnector!.bounds.intersects(this.bConnector!.bounds)) {
            this.aConnector!.remove()
            this.bConnector!.remove()

            this.aConnector = undefined
            this.bConnector = undefined

            this.genChain()
        } else {
            const aPoint = this.calcPoint(this.aConnector!, aDiff, "grow")
            const bPoint = this.calcPoint(this.bConnector!, bDiff, "grow")

            this.aConnector!.lastSegment.point = this.aConnector!.firstSegment.point.add(aPoint)
            this.bConnector!.lastSegment.point = this.bConnector!.firstSegment.point.add(bPoint)
        }
    }

    update() {
        if (this.eitherOutOfBounds()) {
            this.remove()
            return
        }

        const startPts = this.getPoints()
        this.chain!.firstSegment.point = startPts.start
        this.chain!.lastSegment.point = startPts.end

        this.constrainMovement()
    }

    genChain() {
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