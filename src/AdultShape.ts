import paper from "paper";
import ShapeManager from "./ShapeManager";
import {colorDistance, constrain, map, random} from "./HelperFunctions";
import {Relationship} from "./relationship/Relationship";
import * as settings from "../Settings"
import {borderOffset, maxVector} from "../Settings"
import BabyShape from "./BabyShape";

export default class AdultShape {
    shapeManager?: ShapeManager;

    protected _vector?: paper.Point
    shape: paper.Path

    radius: number
    rotation: number
    size: number

    acceleration = new paper.Point(0, 0);
    velocity = new paper.Point(0, 0);

    color: paper.Color
    strokeWidth: number

    relationship?: Relationship;
    inRelationship = false

    teleport = true
    moving = true
    seeking = false

    isLoner: boolean

    constructor(baby: BabyShape) {
        this.shapeManager = baby!.shapeManager;
        this.radius = baby.radius
        this.rotation = baby.rotation
        this.size = baby.size
        this.isLoner = baby.isLoner
        this.color = baby.color
        this.strokeWidth = baby.strokeWidth
        this.shape = baby.shape.clone()

        this.generateFirstVector()
        this.shapeManager!.babyToAdult(baby, this)
    }

    //runs only once to generate the first vector
    protected generateFirstVector() {
        const length = random(settings.minVector, settings.maxVector);
        this.vector = new paper.Point({
            length: length,
            angle: this.rotation - 90,
        });
    }

    attractedTo(other: AdultShape): boolean {
        if (this.isLoner || other.isLoner)
            return false

        const colorDifference = colorDistance(this.color, other.color)
        return colorDifference <= settings.attractionThreshold || colorDifference >= settings.attractionThreshold * 2;
    }

    get vector(): paper.Point | undefined {
        return this._vector;
    }

    set vector(vector: paper.Point) {
        const len = constrain(
            vector.length,
            settings.minVector,
            settings.maxVector
        );
        this._vector = new paper.Point({length: len, angle: vector.angle});
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

        if(this.teleport)
            this.checkBorders();
    }

    nearBorder() {
        return (
            this.position.x < borderOffset ||
            this.position.x > paper.view.size.width - borderOffset ||
            this.position.y < borderOffset ||
            this.position.y > paper.view.size.height - borderOffset)
    }

    //returns true if out of bounds
    outOfBounds(path = this.shape) {
        return (
            !paper.view.bounds.contains(path.position) && !path.bounds.intersects(paper.view.bounds)
        );
    }

    checkBorders() {
        if (this.outOfBounds()) {
            if(!this.position) return

            const center = paper.view.center;
            const dist = this.position.subtract(center).multiply(-1);
            this.position = center.add(dist);
        }
    }

    teleportOpposite() {
        const center = paper.view.center;
        const boundsPath = new paper.Path.Rectangle({
            point: [0, 0],
            size: paper.view.size
        })

        const dist = this.position.subtract(center).multiply(-1);
        this.position = center.add(dist);

        this.position = center.add(dist);
        boundsPath.remove()
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
        const distance = constrain(
            force.length,
            settings.minVector,
            settings.maxVector
        );
        const strength = (G * this.size * shape.size) / distance ** 2;

        shape.vector = force.normalize(strength);
    }

    applyForce(force: paper.Point | undefined, heading = false) {
        const calc = force!.divide(this.size);

        if (calc.length > settings.maxVector)
            calc.normalize(settings.maxVector);

        this.acceleration = this.acceleration.add(calc);

        if (heading) this.pointTowards(force!.angle);
    }

    pointTowards(angle: number) {
        const mod = ((angle - this.shape.rotation) / 180) * settings.maxForce;
        this.shape.rotation += mod;
    }

    seek(target: AdultShape) {
        if (!this.seeking) return

        let desired = target.position.subtract(this.position)
        const d = desired.length;

        if (d < this.size) {
            const m = map(d, 0, this.size, 0, maxVector);
            desired.normalize(m);
        } else {
            desired.normalize(maxVector);
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