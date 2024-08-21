import AdultShape from "../AdultShape";
import ShapeManager from "../ShapeManager";
import {constrain, constrainPoint, delay, nearestBounds, pythag, randomFromArr} from "../HelperFunctions";
import Relationship from "./Relationship";
import {maxBoostVector, maxVector, minVector, oobTolerance, seekDelay} from "../../Settings";
import paper from "paper";

export default class SeekRelationship extends Relationship {
    static centerMeasure: number

    protected _leader!: AdultShape
    timeTillOOB!: number
    boundsDist!: number

    inside = new Set<AdultShape>()
    teleportAllowed = true
    lastTimeInBounds = performance.now()
    lastTeleport?: number

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager) {

        super(partners, dotManager)
        this.leader = this.findLeader()
        this.applyStartRelationshipAll()

        if(!SeekRelationship.centerMeasure)
            SeekRelationship.centerMeasure = pythag(window.innerWidth / 2, window.innerHeight / 2)
    }

    outOfBounds(): boolean {
        for (const a of this.active) {
            if (!a.outOfBounds())
                return false
        }

        return true
    }

    run() {
        if (!this.outOfBounds()) {
            for (const shape of this.inside) {
                if (shape !== this.leader) {
                    shape.alignPivot(this.leader.pivot)
                    shape.pointTowards(this.leader.vector.angle)
                }
            }
        } else {
            this.lastTimeInBounds = performance.now()

            if (this.teleportAllowed) {
                this.teleportAll()
                this.teleportAllowed = false
                setTimeout(() => {
                    this.teleportAllowed = true
                }, this.timeTillOOB)
            }
            else if (performance.now() - this.lastTimeInBounds >= this.timeTillOOB + oobTolerance) {
                this.leader.shape.opacity = 0
                this.leader.position = paper.Point.random().multiply(paper.view.viewSize);
                this.leader.fadeInOOB()

                for (const shape of this.inside) {
                    shape.shape.opacity = 0
                    shape.alignPivot(this.leader.pivot)
                    shape.fadeInOOB()
                }
            }
        }
    }

    seek(shape: AdultShape) {
        const target = this.leader.pivot
        let desired = target.subtract(shape.pivot)

        const shapeBounds = nearestBounds(shape.pivot)
        const newTarget = this.reflectedTarget(shapeBounds, shape.pivot)

        if(newTarget) {
            const oobDist = newTarget.subtract(shape.pivot)
            if (oobDist.length < desired.length / 2)
                desired = newTarget.subtract(shape.pivot)
        }

        desired.length = shape.boosting ? constrain(shape.boostSpeed, minVector, maxBoostVector) : maxVector

        let steer = desired.subtract(shape.velocity)
        shape.applyForce(steer);
        shape.pointTowards(desired.angle)
    }

    reflectedTarget(shapeBounds: paper.Point[], shape: paper.Point): paper.Point | undefined {
        const center = paper.view.center
        const bounds = paper.view.bounds
        const target = this.leader.pivot

        const targetCenter = constrainPoint(
            target.subtract(center),
            -center.x, -center.y,
            center.x, center.y)

        const overflow = target.subtract(center).subtract(targetCenter)

        let oobDist = paper.view.center.multiply(2)
        let newTarget: paper.Point

        for (const b of shapeBounds) {
            const offset = new paper.Point(0, 0)
            const reflect = new paper.Point(1, 1)

            //if vertical, mirror y axis
            //if horizontal, mirror x axis
            if (b.y === bounds.bottom) {
                offset.y = bounds.height
                reflect.x = -1
            } else if (b.y === 0) {
                offset.y = -bounds.height
                reflect.x = -1
            }

            if (b.x === bounds.right) {
                offset.x = bounds.width
                reflect.y = -1
            } else if (b.x === 0) {
                offset.x = -bounds.width
                reflect.y = -1
            }

            const adjOver = overflow.multiply(new paper.Point(reflect.y, reflect.x))
            const newCenter = center.add(offset)
            const target = newCenter.add(targetCenter.multiply(reflect))
            const dist = target.subtract(shape)

            if (dist.length < oobDist.length) {
                oobDist = dist
                newTarget = target.add(adjOver)
            }
        }

        //@ts-ignore
        return newTarget
    }


    insideRel(shape: AdultShape, arriveBy: number) {
        return new Promise(async (resolve, reject) => {
            if (shape?.relationship !== this) {
                shape.generateVector()
                reject("SeekRelationship: shape no longer in relationship")
                return
            } else if (this.leader == shape) {
                shape.generateVector()
                reject("Leader stopped from going into seek relationship")
                return
            }

            if (this.leader !== undefined && shape !== undefined) {
                const dist = this.leader.pivot.subtract(shape.pivot).length

                if (performance.now() >= arriveBy) {
                    shape.boosting = true
                    shape.boostSpeed += (performance.now() - arriveBy) / 2500
                }

                if (dist <= shape.velocity.length * 1.5) {
                    await delay(seekDelay)
                    resolve(true);
                } else {
                    this.seek(shape)
                    await delay(seekDelay)
                    this.insideRel(shape, arriveBy).then(resolve, reject)
                }
            } else {
                await delay(seekDelay)
                this.insideRel(shape, arriveBy).then(resolve, reject)
            }
        });
    }

    removeInside(partner: AdultShape) {
        return this.inside.delete(partner)
    }

    maxTimeArrive(shape: AdultShape) {
        const dist = this.leader.pivot.subtract(shape.pivot).length
        const time = shape.timeTillOOB(true, dist)

        return time * 8
    }

    calcBoundsDist() {
        let max = 0

        for (const shape of this.active) {
            if (shape.bounds.bounds.height > max)
                max = shape.bounds.bounds.height
        }

        return max
    }

    applyRelationshipStart(shape: AdultShape) {
        super.applyRelationshipStart(shape);

        if (shape == this.leader) {
            shape.applyVector = true
            shape.teleport = false
            shape.boosting = false
            return
        }

        shape.applyVector = false

        const maxTime = this.maxTimeArrive(shape)
        this.insideRel(shape, performance.now() + maxTime).then(() => {
            shape.teleport = false
            shape.boosting = false
            this.inside.add(shape)
            this.updateTimeOOB()
        })
    }

    applyRelationshipEnd(shape: AdultShape) {
        super.applyRelationshipEnd(shape)
        shape.teleport = true
        shape.applyVector = true
        this.removeInside(shape)

        if (shape == this.leader) {
            this.leader = this.findLeader()
        }

        this.updateTimeOOB()
    }

    findLeader(): AdultShape {
        const leader = randomFromArr(Array.from(this.partners))
        this.removeInside(leader)
        return leader
    }

    teleportAll() {
        for (const a of this.active) {
            a.teleportOpposite()
        }

        this.lastTeleport = performance.now()
    }

    info() {
        const base = super.info()
        let insideStr = ""

        for (const partner of this.inside) {
            insideStr += `${partner.name}<br>`
        }

        return `${base}<br>leader: ${this.leader.name}<br>inside: ${insideStr}`
    }

    updateTimeOOB() {
        if (this.boundsDist == this.calcBoundsDist())
            return

        this.boundsDist = this.calcBoundsDist()
        this.timeTillOOB = this.leader.timeTillOOB(true, this.calcBoundsDist())
    }

    get active() {
        let inside = new Set(this.inside)
        inside.add(this.leader)
        return inside
    }

    get leader() {
        return this._leader
    }

    set leader(leader) {
        this._leader = leader

        leader.teleport = false
        leader.boosting = false
        leader.applyVector = true

        this.updateTimeOOB()
    }
}