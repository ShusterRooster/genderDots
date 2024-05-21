import paper from "paper";
import ColorManager from "./ColorManager";
import ShapeManager from "./ShapeManager";
import {constrain, map, random} from "./HelperFunctions";
import {Relationship} from "./Relationship";
import * as settings from "../Settings"
import {borderOffset, maxVector} from "../Settings"
import BabyShape from "./BabyShape";

export default class AdultShape {
    shapeManager?: ShapeManager;

    protected _vector?: paper.Point
    symbol: paper.SymbolItem

    radius: number
    rotation: number
    size: number

    acceleration = new paper.Point(0, 0);
    velocity = new paper.Point(0, 0);

    relationshipColor?: paper.Color
    color: paper.Color
    relationship?: Relationship;
    isLoner: boolean

    constructor(baby: BabyShape) {
        this.shapeManager = baby!.shapeManager;
        this.radius = baby.radius
        this.rotation = baby.rotation
        this.size = baby.size
        this.isLoner = baby.isLoner
        this.color = baby.color

        this.generateFirstVector()

        const def = new paper.SymbolDefinition(baby.shape)
        this.symbol = new paper.SymbolItem(def)
        // console.log(baby.shape.position)

        this.symbol.position = baby.spawnPoint.add(baby.shape.pivot)

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
        if(this.isLoner || other.isLoner)
            return false

        const colorDifference = ColorManager.colorDistance(this.color, other.color)
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

        // this.drawLineTo(this.position.add(this._vector));
    }

    applyColor(color: paper.Color) {
        this.relationshipColor = color
        this.symbol.strokeColor = color
    }

    get position() {
        return this.symbol.position;
    }

    set position(position: paper.Point) {
        this.symbol.position = position;
    }

    run() {
        this.updatePosition();
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
    outOfBounds() {
        return (
            !paper.view.bounds.contains(this.position) && !this.symbol.bounds.intersects(paper.view.bounds)
        );
    }

    checkBorders() {
        // if(!this.nearBorder())
        //     return

        if (this.outOfBounds()) {
            const center = paper.view.center;
            const dist = this.position.subtract(center).multiply(-1);
            this.position = center.add(dist);
        }
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
        // angle = this.rotation;

        const mod = ((angle - this.symbol.rotation) / 180) * settings.maxForce;
        this.symbol.rotation += mod;
    }

    seek(target: AdultShape) {
        const desired = target.position.subtract(this.position)
        const d = desired.length;

        if (d < this.size) {
            const m = map(d, 0, this.size, 0, maxVector);
            desired.normalize(m);
        } else {
            desired.normalize(maxVector);
        }

        if (!target.outOfBounds()) {
            const steer = desired.subtract(this.velocity);
            this.applyForce(steer);

            this.pointTowards(desired.angle);
        }
    }

    updatePosition() {
        const dragMag = settings.friction * this.velocity.length ** 2;
        const drag = this.velocity
            .multiply(-settings.friction)
            .normalize(dragMag);
        this.applyForce(drag);

        // console.log(this.velocity)

        this.applyForce(this.vector);
        this.velocity = this.velocity.add(this.acceleration);
        this.symbol!.position = this.symbol!.position.add(this.velocity);
        this.acceleration = this.acceleration.multiply(0);
    }
}
