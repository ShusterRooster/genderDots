import paper from "paper";
import ShapeManager from "./ShapeManager";
import {
    centerOpposite,
    colorDistance,
    constrain,
    delay,
    direction,
    generateID,
    map,
    outOfBounds,
    pythag,
    random,
    testDot
} from "./HelperFunctions";
import Relationship from "./relationship/Relationship";
import {
    attractionThreshold,
    boostVector,
    debugMode,
    friction,
    maxBoostVector,
    maxRotationSpeed,
    maxVector,
    minRotationSpeed,
    minVector,
    oobTolerance,
    recursiveDelay,
    rotationTolerance,
} from "../Settings"
import BabyShape from "./BabyShape";
import EventLog from "./debug/EventLog";

export default class AdultShape {
    name: string
    shapeManager?: ShapeManager;

    protected _vector: paper.Point
    shape: paper.Path

    radius: number
    baseRotation: number
    size: number

    protected _relationship?: Relationship;
    protected _pendingRelationship?: Relationship;

    acceleration = new paper.Point(0, 0);
    velocity = new paper.Point(0, 0);

    color: paper.Color
    strokeWidth: number

    genitalWidth: number
    genitalHeight: number

    lastTimeInBounds = performance.now()
    lastTimeTeleported = performance.now()
    teleportAllowed = true
    timeOOB: number

    teleport = true
    moving = true
    applyVector = true

    boosting = false
    boostPaths = new Set<paper.Path>
    boostSpeed = boostVector

    isLoner: boolean
    eventLog?: EventLog

    pivotOffset: paper.Point
    angleOffset: number
    pivotPoint?: paper.Path
    spawnPoint: paper.Point
    bounds: paper.Path

    constructor(baby: BabyShape) {
        this.shapeManager = baby?.shapeManager;
        this.radius = baby.radius
        this.baseRotation = this.adjustAngle(baby.rotation) - 90
        this.size = baby.size
        this.isLoner = baby.isLoner
        this.color = baby.color
        this.strokeWidth = baby.strokeWidth
        this.shape = baby.shape.clone()
        this.name = this.shapeManager ? generateID(this, this.shapeManager.adults) : "test"

        this.genitalWidth = baby.genitalWidth
        this.genitalHeight = baby.genitalHeight
        this.spawnPoint = baby.spawnPoint

        this.pivotOffset = this.calcPivotOffset(baby.shapeBounds!, baby.sex)
        this.angleOffset = this.adjRotation - this.adjustAngle(this.pivotOffset.angle)

        this.bounds = new paper.Path.Rectangle(baby.shapeBounds!)
        this.bounds.rotate(this.shape.rotation, this.pivot)
        this.bounds.position = this.position

        this._vector = this.generateFirstVector()
        this.shapeManager?.babyToAdult(baby, this)
        this.timeOOB = this.timeTillOOB(true)

        if (debugMode) {
            this.eventLog = new EventLog(this)
            this.eventLog.create(`${this.name} successfully initialized!`)
            this.pivotPoint = testDot(this.pivot)
        }
    }

    attractedTo(other: AdultShape): boolean {
        if (this.isLoner || other.isLoner)
            return false

        const colorDifference = colorDistance(this.color, other.color)
        return colorDifference <= attractionThreshold || colorDifference >= attractionThreshold * 2;
    }

    run() {
        this.bounds.position = this.position

        if (this.moving)
            this.updatePosition();

        if (this.teleport) {
            this.checkBounds()
        }

        if (this.boosting) {
            const clone = this.shape.clone()
            clone.opacity = 0.25
            this.boostPaths.add(clone)
        }

        if (this.boostPaths.size > 0) {
            this.boost()
        }

        if (this.applyVector) {
            this.pointTowards(this.vector.angle)
        }

        if (debugMode)
            this.pivotPoint!.position = this.pivot
    }

    //returns true if out of bounds
    outOfBounds() {
        return outOfBounds(this.bounds)
    }

    checkBounds() {
        if (this.outOfBounds() && this.position) {
            if (this.teleportAllowed) {
                this.teleportOpposite()
                this.teleportAllowed = false

                setTimeout(() => {
                    this.teleportAllowed = true
                }, this.timeOOB)
            } else {
                if (performance.now() - this.lastTimeInBounds >= this.timeOOB + oobTolerance) {
                    this.eventLog?.create(`Stuck out of bounds at position ${this.position}`)

                    console.log(`${this.name} stuck out of bounds!!`)

                    this.shape.opacity = 0
                    this.position = paper.Point.random().multiply(paper.view.viewSize);
                    this.fadeInOOB()
                }
            }
        } else {
            this.teleportAllowed = true
            this.lastTimeInBounds = performance.now()
        }
    }

    teleportOpposite() {
        this.position = centerOpposite(this.pivot)
        this.lastTimeTeleported = performance.now()
    }

    promiseInBounds() {
        return new Promise(async (resolve) => {
            if (!this.outOfBounds()) {
                resolve(true);
            } else {
                await delay(recursiveDelay)
                this.promiseInBounds().then(resolve)
            }
        });
    }

    fadeInOOB() {
        this.shape.tweenTo({opacity: 1}, 1000)
    }

    timeTillOOB(stable = true,
                dist = this.boundsHeight) {

        const velocity = stable ? this.stableVelocity() : this.velocity
        const milli = (1 / 60) * 1000
        return (dist / velocity.length) * milli
    }

    pointTowards(angle: number) {
        const diff = this.adjustAngle(angle) - this.adjRotation
        const absDiff = Math.abs(diff)

        if (absDiff < rotationTolerance) return
        const mod = map(absDiff, 0, 360, minRotationSpeed, maxRotationSpeed, true)

        this.shape.rotate(mod * direction(diff), this.pivot)
        this.bounds.rotate(mod * direction(diff), this.pivot)
    }

    arrive(target: AdultShape) {
        let desired = target.pivot.subtract(this.pivot)

        // let d = desired.length
        // const damped = desired.length = map(d, 0, this.radius, 0, maxVector);
        // desired.length = d < this.radius ? damped : maxVector

        //follow target oob
        if (target.relationship) {
            const revTarget = target.pivot.subtract(paper.view.center).multiply(-1)
            const dist = revTarget.subtract(this.pivot)

            console.log(dist.length)

            if (dist.length <= target.radius + this.radius) {
                desired = dist
                console.log("will it follow OOB?")
            }
        }

        let max = this.boosting ? maxBoostVector : maxVector
        desired.length = constrain(this.boostSpeed, minVector, max)

        // Steering = Desired minus Velocity
        let steer = desired.subtract(this.velocity)
        this.applyForce(steer);
        this.pointTowards(desired.angle)
    }

    boost() {
        for (const path of this.boostPaths) {
            path.tweenTo({opacity: 0}, 500).then(() => {
                this.boostPaths.delete(path)
                path.remove()
            })
        }
    }

    applyForce(force: paper.Point, heading = false) {
        const calc = force!.divide(this.size);
        calc.length = calc.length >= maxVector ? maxVector : calc.length
        this.acceleration = this.acceleration.add(calc);

        if (heading) this.pointTowards(force!.angle);
    }

    virtualForce(force: paper.Point) {
        const calc = force!.divide(this.size);
        calc.length = calc.length > maxVector ? maxVector : calc.length

        return calc
    }

    stableVelocity(loop = 120) {
        let velocity = new paper.Point(0, 0),
            acceleration = velocity

        for (let i = 0; i < loop; i++) {
            const drag = this.virtualForce(this.calcDrag(velocity))
            const vector = this.virtualForce(this.vector!);
            acceleration = acceleration.add(drag).add(vector)
            velocity = velocity.add(acceleration);

            acceleration = acceleration.multiply(0);
        }

        return velocity
    }

    calcDrag(velocity = this.velocity) {
        const dragMag = friction * velocity.length ** 2;
        const drag = velocity.multiply(-friction)
        drag.length = dragMag

        return drag
    }

    updatePosition() {
        this.applyForce(this.calcDrag());
        if (this.applyVector) this.applyForce(this.vector);

        this.velocity = this.velocity.add(this.acceleration);
        this.shape.position = this.shape.position.add(this.velocity);
        this.acceleration = this.acceleration.multiply(0);
    }

    //runs only once to generate the first vector
    protected generateFirstVector() {
        const length = random(minVector, maxVector);
        return new paper.Point({
            length: length,
            angle: this.adjRotation,
        });
    }

    generateVector() {
        const length = random(minVector, maxVector);
        this.vector = new paper.Point({
            length: length,
            angle: random(0, 360),
        });
    }

    calcHeight(sex: string) {
        const diameter = this.radius * 2
        let height: number

        if (sex == "female")
            height = diameter
        else
            height = this.genitalHeight + diameter

        return height
    }

    calcPivotOffset(shapeBounds: paper.Rectangle, sex: string) {
        const path = new paper.Path.Rectangle(shapeBounds)
        path.rotate(this.shape.rotation)

        path.position = path.position.add(this.position.subtract(path.bounds.center))

        const ideal = new paper.Point({
            length: pythag(this.radius, this.radius),
            angle: this.shape.rotation - 45
        }).add(path.firstSegment.point)

        const height = this.calcHeight(sex)
        const diff = height - shapeBounds.height
        let pivot: paper.Point

        if (sex == "female") {
            const offset = new paper.Point({
                length: diff,
                angle: this.rotation + 180
            })

            pivot = ideal.add(offset)
        } else if (sex == "intersex") {
            const interHeight = ((height - diff) + (diff / 2))
            const interDiff = interHeight - shapeBounds.height

            pivot = new paper.Point({
                length: interDiff + (diff / 2),
                angle: this.rotation + 180
            }).add(ideal)
        } else {
            pivot = ideal
        }

        path.remove()
        return this.position.subtract(pivot)
    }

    alignPivot(pivot: paper.Point) {
        const dist = pivot.subtract(this.pivot)
        this.position = this.position.add(dist)
    }

    get pivot() {
        return new paper.Point({
            length: this.pivotOffset.length,
            angle: (this.rotation + 180) + (this.angleOffset / 2)
        }).add(this.position)
    }

    get boundsHeight() {
        return this.bounds.bounds.height
    }

    get relationship(): Relationship | undefined {
        return this._relationship
    }

    set relationship(relationship: Relationship | undefined) {
        this.eventLog?.create(`Relationship ${relationship?.name} set!`, relationship)
        this._relationship = relationship
    }

    get pendingRelationship(): Relationship | undefined {
        return this._pendingRelationship
    }

    set pendingRelationship(relationship: Relationship | undefined) {
        this.eventLog?.create(`Pending relationship set as ${relationship?.name}!`, relationship)
        this._pendingRelationship = relationship
    }

    get inRelationship() {
        return this.relationship !== undefined
    }

    get pending() {
        return this.pendingRelationship !== undefined
    }

    get vector(): paper.Point {
        return this._vector;
    }

    set vector(vector: paper.Point) {
        const len = constrain(
            vector.length,
            minVector,
            maxVector
        );

        const vec = this._vector = new paper.Point({length: len, angle: vector.angle});
        this.timeOOB = this.timeTillOOB()

        this.eventLog?.create(`New vector set! ${vec}`)
        this.eventLog?.create(`Time out of bounds set to ${this.timeOOB}`)
    }

    get rotation() {
        return this.shape.matrix.rotation - 90
    }

    set rotation(rotation: number) {
        const diff = this.adjustAngle(rotation) - this.shape.rotation
        this.shape.rotate(diff + 90, this.pivot)
    }

    adjustAngle(angle: number) {
        return angle < 0 ? 360 + angle : angle
    }

    get adjRotation() {
        return this.adjustAngle(this.rotation)
    }

    get position() {
        return this.shape.position;
    }

    set position(position: paper.Point) {
        this.shape.position = position;
    }
}