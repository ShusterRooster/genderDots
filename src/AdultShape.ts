import paper from "paper";
import ShapeManager from "./ShapeManager";
import {between, colorDistance, constrain, generateID, map, outOfBounds, random} from "./HelperFunctions";
import Relationship from "./relationship/Relationship";
import * as settings from "../Settings"
import {
    attractionThreshold,
    debugMode,
    maxSeekSpeed,
    maxTimeOOB,
    maxVector,
    minVector,
    rotationSpeedDeg,
    rotationTolerance,
    trailFadeDelay,
    trailFadeSpeed
} from "../Settings"
import BabyShape from "./BabyShape";
import EventLog from "./EventLog";

export default class AdultShape {
    name: string
    shapeManager?: ShapeManager;

    protected _vector?: paper.Point
    shape: paper.Path

    radius: number
    rotation: number
    baseRotation: number
    size: number

    acceleration = new paper.Point(0, 0);
    velocity = new paper.Point(0, 0);

    color: paper.Color
    strokeWidth: number

    genitalWidth: number
    genitalHeight: number
    _relationship?: Relationship;
    lastTimeInBounds = performance.now()

    teleport = true
    moving = true

    isLoner: boolean
    eventLog?: EventLog
    pivotPt: paper.Point

    constructor(baby: BabyShape) {
        this.shapeManager = baby?.shapeManager;
        this.radius = baby.radius
        this.rotation = baby.rotation
        this.baseRotation = baby.rotation
        this.size = baby.size
        this.isLoner = baby.isLoner
        this.color = baby.color
        this.strokeWidth = baby.strokeWidth
        this.shape = baby.shape.clone()
        this.name = this.shapeManager ? generateID(this, this.shapeManager.adults): "test"
        this.pivotPt = baby.pivotPt!

        this.genitalWidth = baby.genitalWidth
        this.genitalHeight = baby.genitalHeight

        this.shape.pivot = this.pivotPt
        this.generateFirstVector()
        this.shapeManager?.babyToAdult(baby, this)

        if(debugMode) {
            this.eventLog = new EventLog(this)
            this.eventLog.create(`${this.name} successfully initialized!`)
        }
    }

    //runs only once to generate the first vector
    protected generateFirstVector() {
        const length = random(minVector, maxVector);
        this.vector = new paper.Point({
            length: length,
            angle: this.rotation - 90,
        });
    }

    generateVector() {
        const length = random(minVector, maxVector);
        this.vector = new paper.Point({
            length: length,
            angle: random(0, 360),
        });

        this.pointTowardsRecursion(this.vector.angle)
    }

    attractedTo(other: AdultShape): boolean {
        if (this.isLoner || other.isLoner)
            return false

        const colorDifference = colorDistance(this.color, other.color)
        return colorDifference <= attractionThreshold || colorDifference >= attractionThreshold * 2;
    }

    get relationship(): Relationship | undefined {
        return this._relationship
    }

    set relationship(relationship: Relationship | undefined) {
        this.eventLog?.create(`Relationship ${relationship} set!`, relationship)
        this._relationship = relationship
    }

    get inRelationship() {
        return this.relationship !== undefined
    }

    get vector(): paper.Point | undefined {
        return this._vector;
    }

    set vector(vector: paper.Point) {
        const len = constrain(
            vector.length,
            minVector,
            maxVector
        );

        const vec = this._vector = new paper.Point({length: len, angle: vector.angle});
        this.eventLog?.create(`New vector set! ${vec}`)
    }

    get position() {
        return this.shape.position;
    }

    set position(position: paper.Point) {
        this.shape.position = position;
    }

    run() {
        if (this.moving)
            this.updatePosition();

        if (this.teleport)
            this.checkBorders();
    }

    //returns true if out of bounds
    outOfBounds() {
        return outOfBounds(this.shape)
    }

    checkBorders() {
        if (this.outOfBounds()) {
            if (!this.position) return

            this.teleportOpposite()
        }
        else {
            this.lastTimeInBounds = performance.now()
        }
    }

    promiseInBounds() {
        return new Promise(async (resolve) => {
            if (!this.outOfBounds()) {
                resolve(true);
            } else {
                // await delay(teleportDelayTime)
                this.promiseInBounds().then(resolve)
            }
        });
    }

    teleportOpposite() {
        this.stuckOutOfBounds()
        const center = paper.view.center;
        const dist = this.position.subtract(center).multiply(-1);
        this.position = center.add(dist);
    }

    fadeInOOB() {
        if (this.shape.opacity < 1) {
            this.shape.opacity += trailFadeSpeed
            setTimeout(() => this.fadeInOOB(), trailFadeDelay)
        } else {
            return
        }
    }

    stuckOutOfBounds() {
        if(!this.inRelationship && performance.now() - this.lastTimeInBounds >= maxTimeOOB) {
            this.eventLog?.create(`Stuck out of bounds at position ${this.position}`)
            this.shape.opacity = 0
            this.position = paper.Point.random().multiply(paper.view.viewSize);
            this.fadeInOOB()
        }
    }

    getOutsidePoint(angle: number) {
        const pt = new paper.Point({
            angle: angle,
            length: this.radius,
        }).add(this.position)

        return this.shape.getNearestPoint(pt)
    }

    attractShape(shape: AdultShape) {
        const G = 6.67428 * 10 ** -11;
        let force = this.position.subtract(shape.position);
        const strength = (G * this.size * shape.size) / force.length ** 2;
        shape.applyForce(force.normalize(strength))

        return force.length < shape.size
    }

    applyForce(force: paper.Point | undefined, heading = false) {
        const calc = force!.divide(this.size);

        if (calc.length > maxVector)
            calc.length = maxVector

        this.acceleration = this.acceleration.add(calc);

        if (heading) this.pointTowards(force!.angle);
    }

    pointTowards(angle: number) {
        angle += 90
        const rot = (angle - this.shape.rotation)
        const mod = (rot / rotationSpeedDeg)
        this.shape.rotation += mod;
    }

    pointTowardsRecursion(angle: number) {
        if(!between(this.shape.rotation + 90, angle - rotationTolerance, angle + rotationTolerance)) {
            this.pointTowards(angle);

            setTimeout(() => {
                this.pointTowardsRecursion(angle)
            }, 25)
        }
    }

    seek(target: AdultShape) {
        if (target.outOfBounds() || this.outOfBounds())
            return

        let desired = target.position.subtract(this.position)
        const d = desired.length;

        if (d < this.size) {
            desired.length = map(d, 0, this.size, 0, maxSeekSpeed);
        } else {
            desired.length = maxSeekSpeed
        }

        const steer = desired.subtract(this.velocity);
        this.applyForce(steer);
        this.pointTowards(desired.angle);
    }

    updatePosition() {
        const dragMag = settings.friction * this.velocity.length ** 2;
        const drag = this.velocity
            .multiply(-settings.friction)
            .normalize(dragMag);
        this.applyForce(drag);

        this.applyForce(this.vector);
        this.velocity = this.velocity.add(this.acceleration);
        this.shape!.position = this.shape!.position.add(this.velocity);
        this.acceleration = this.acceleration.multiply(0);
    }
}