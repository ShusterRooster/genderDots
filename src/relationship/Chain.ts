import paper from "paper";
import * as settings from "../../Settings"
import {chainGrowSpeed, chainShrinkDelay, chainShrinkSpeed} from "../../Settings"
import AdultShape from "../AdultShape";
import PathArray from "../PathArray";
import {inBounds} from "../HelperFunctions";

export default class Chain {
    a: AdultShape
    b: AdultShape

    aConnector?: paper.Path
    bConnector?: paper.Path

    avgColor: paper.Color
    protected _chain?: paper.Path
    lineArr = new PathArray("lineArr")
    growDirection = 1
    thickness: number

    constructor(a: AdultShape, b: AdultShape) {
        this.a = a
        this.b = b
        this.avgColor = this.a.color.add(this.b.color).divide(2)
        this.thickness = (this.a.strokeWidth + this.b.strokeWidth) / 2
    }

    run() {
        //out of bounds
        if (!this.inBounds()) {
            if (this.chainExists()) {
                this.shrinkChain()
                this.remove()
            }

            //while connecting and one OOB
            if (this.connectorsExist()) {
                this.growDirection = -1
                this.shrinkConnectors()
            }
        }

        //in bounds
        else if (this.inBounds()) {
            //if normal
            if (this.chainExists()) {
                this.update()
            }
            //chain doesn't exist
            else {
                if (this.connectorsExist()) {
                    if (this.aConnector!.position == undefined ||
                        this.bConnector!.position == undefined) {
                        this.growDirection = 1
                    } else if (this.growDirection == 1)
                        this.grow()
                    else {
                        this.shrink()
                    }
                } else {
                    this.growDirection = 1
                    this.initConnectors()
                }
            }
        }
    }

    grow() {
        if (this.aConnector!.bounds.intersects(this.bConnector!.bounds)) {
            this.removeConnectors()
            this.genChain()
        } else {
            const startPts = this.getPoints()
            const desired = startPts[0].add(startPts[1]).divide(2)
            const aDiff = desired.subtract(startPts[0])
            const bDiff = desired.subtract(startPts[1])

            this.aConnector!.firstSegment.point = startPts[0]
            this.bConnector!.firstSegment.point = startPts[1]

            const aPoint = this.calcPoint(this.aConnector!, aDiff, "grow")
            const bPoint = this.calcPoint(this.bConnector!, bDiff, "grow")

            this.aConnector!.lastSegment.point = this.aConnector!.firstSegment.point.add(aPoint)
            this.bConnector!.lastSegment.point = this.bConnector!.firstSegment.point.add(bPoint)
        }
    }

    shrink() {
        if (this.aConnector!.length > chainGrowSpeed &&
            this.bConnector!.length > chainGrowSpeed) {

            const startPts = this.getPoints()
            const start = startPts[0]
            const end = startPts[1]
            const mid = start.add(end).divide(2)

            const startMidDiff = mid.subtract(start)
            const startToMid = new paper.Point({
                length: startMidDiff.length - chainShrinkSpeed,
                angle: startMidDiff.angle
            })

            const midEndDiff = end.subtract(mid)
            const midToEnd = new paper.Point({
                length: midEndDiff.length - chainShrinkSpeed,
                angle: midEndDiff.angle
            })

            this.aConnector!.firstSegment.point = start
            this.bConnector!.firstSegment.point = end

            this.aConnector!.lastSegment.point = start.add(startToMid)
            this.bConnector!.lastSegment.point = end.add(midToEnd)
        } else {
            this.removeConnectors()
        }
    }

    shrinkCenter(path: paper.Path, clone = true) {
        if (clone) {
            const oldPath = path
            path = path.clone()
            oldPath.remove()
        }

        if (path.length > chainGrowSpeed) {
            const mid = path.firstSegment.point.add(path.lastSegment.point).divide(2)

            const startMidDiff = mid.subtract(path.firstSegment.point)
            const midEndDiff = path.lastSegment.point.subtract(mid)

            const startToMid = new paper.Point({
                length: startMidDiff.length - chainShrinkSpeed,
                angle: startMidDiff.angle
            })

            const midToEnd = new paper.Point({
                length: midEndDiff.length - chainShrinkSpeed,
                angle: midEndDiff.angle
            })

            path.firstSegment.point = mid.subtract(startToMid)
            path.lastSegment.point = mid.add(midToEnd)

            setTimeout(() => this.shrinkCenter(path, false), chainShrinkDelay)
        } else {
            path.remove()
        }
    }


    shrinkConnectors() {
        this.shrinkCenter(this.aConnector!)
        this.shrinkCenter(this.bConnector!)
    }

    shrinkChain() {
        this.initConnectors()
        this.removeChain()

        const startPts = this.getPoints()
        const start = startPts[0]
        const end = startPts[1]
        const mid = start.add(end).divide(2)

        this.aConnector!.firstSegment.point = start
        this.aConnector!.lastSegment.point = mid

        this.bConnector!.firstSegment.point = mid
        this.bConnector!.lastSegment.point = end

        this.shrinkConnectors()
    }

    update() {
        const startPts = this.getPoints()
        this.chain!.firstSegment.point = startPts[0]
        this.chain!.lastSegment.point = startPts[1]

        this.constrainMovement()
    }

    initConnectors() {
        this.aConnector = new paper.Path.Line({
            from: this.a.position,
            to: this.a.position,
            strokeColor: this.a.color,
            strokeCap: 'round',
            strokeWidth: this.thickness
        })

        this.bConnector = new paper.Path.Line({
            from: this.b.position,
            to: this.b.position,
            strokeColor: this.b.color,
            strokeCap: 'round',
            strokeWidth: this.thickness
        })
    }


    getPoints() {
        const line = new paper.Path.Line({
            from: this.a.position,
            to: this.b.position
        })

        const aStart = this.getIntersections(this.a, line)
        const bStart = this.getIntersections(this.b, line)

        line.remove()
        return [aStart, bStart]
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

    genChain() {
        const startPts = this.getPoints()
        this.chain = new paper.Path.Line({
            from: startPts[0],
            to: startPts[1],
            strokeColor: this.avgColor,
            strokeCap: 'round',
            strokeWidth: this.thickness
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

    remove() {
        this.removeChain()
        this.removeConnectors()
    }

    removeChain() {
        this._chain?.remove()
        this._chain = undefined
        this.lineArr.clearArr()
    }

    removeConnectors() {
        this.aConnector?.remove()
        this.bConnector?.remove()

        this.aConnector = undefined
        this.bConnector = undefined
    }

    connectorsExist() {
        return this.aConnector !== undefined || this.bConnector !== undefined
    }

    chainExists() {
        return this._chain !== undefined
    }

    inBounds() {
        return inBounds(this.a.shape) && inBounds(this.b.shape)
    }

    getIntersections(shape: AdultShape, line: paper.Path) {
        const inter = line.getIntersections(shape.shape)
        if (inter.length > 0)
            return inter[0].point
        else
            return shape.position
    }

    get chain(): paper.Path | undefined {
        return this._chain
    }

    set chain(chain: paper.Path) {
        this._chain = chain
        this.lineArr.push(chain)
    }
}