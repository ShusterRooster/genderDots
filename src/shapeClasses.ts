import paper from "paper";
import ColorManager from "./ColorManager";
import ShapeManager from "./ShapeManager";
import {constrain, map, PathArray, random} from "./HelperFunctions";
import {Relationship} from "./Relationship";
import * as settings from "../Settings"
import {maxVector} from "../Settings"

function Appendage(
    x: number,
    y: number,
    width: number,
    height: number
): paper.Path.Line {
    const leftLine = new paper.Path.Line({
        name: "leftLine",
        from: [x, y],
        to: [x, y - height],
    });

    const midArc = new paper.Path.Arc({
        name: "midArc",
        from: [x, y - height],
        through: [x + width / 2, y - height - width / 2],
        to: [x + width, y - height],
    });

    const rightLine = new paper.Path.Line({
        name: "rightLine",
        from: [x + width, y - height],
        to: [x + width, y],
    });

    //joins paths together then returns
    leftLine.join(midArc);
    leftLine.join(rightLine);

    leftLine.closed = true;
    leftLine.name = "Appendage";

    return leftLine;
}

interface Genital {
    name: string;
    path: paper.Path.Line;
}

export interface babyShape {
    dotManager?: ShapeManager;
    spawnPoint?: paper.Point;
    radius?: number;
    distance?: number;
    sex?: string;
    genitalWidth?: number;
    genitalEndHeight?: number;
    color?: paper.Color;
}

export class BabyShape {
    spawnPoint: paper.Point;
    shapeManager: ShapeManager | undefined;
    colorManager: ColorManager;
    sex: string;

    distance: number;
    protected _vector: paper.Point | undefined;
    protected _shape: any;

    protected scaleSpeed: number;
    protected growSpeed: number;
    rotation = random(0, 360);

    doneGrowing = false;
    doneScaling = false;
    ready = false;

    circleArr = new PathArray("circleArr");
    shapeArr = new PathArray("shapeArr");
    appendageArr = new PathArray("appendageArr", 0);

    radius: number;
    genitalWidth: number;
    genitalHeight = 0;
    genitalEndHeight: number;
    isLoner = Math.random() * 100 <= settings.lonerChance;

    constructor(shape: babyShape) {
        this.shapeManager = shape.dotManager;
        this.spawnPoint =
            shape.spawnPoint ?? paper.Point.random().multiply(paper.view.viewSize);

        this.radius =
            shape.radius ?? random(settings.minRadius, settings.maxRadius);

        this.distance =
            shape.distance ?? random(settings.minDistance, settings.maxDistance);

        this.sex = shape.sex ?? BabyShape.determineSex();

        this.genitalWidth =
            shape.genitalWidth ??
            random(this.radius / settings.genitalDiv, this.radius);

        this.genitalEndHeight =
            shape.genitalEndHeight ??
            random(this.radius / settings.genitalDiv, this.radius);

        this.scaleSpeed =
            settings.baseScaleSpeed * (1 - this.distance / settings.maxDistance);

        this.growSpeed =
            (this.genitalWidth * this.genitalEndHeight) /
            (settings.maxRadius / settings.genitalDiv) ** 2;

        this.colorManager = new ColorManager(this, shape.color);

        if (this.isLoner) this.colorManager.color = this.colorManager.generateGray()
    }

    protected static determineSex() {
        const sexes = settings.sexes;
        const random = Math.random() * 100;

        // Loop through sexes and accumulate probability
        let accumulatedProbability = 0;

        for (const sex of sexes) {
            accumulatedProbability += sex.probability;
            if (random <= accumulatedProbability) {
                return sex.name; // Return the name of the sex
            }
        }

        // If no match is found (shouldn't happen), return the last sex
        return sexes[sexes.length - 1].name;
    }

    calcSize(height = this.genitalHeight) {
        const size = this.genitalWidth * height * this.radius;
        return map(
            size,
            settings.minSize,
            settings.maxSize,
            settings.minRadius,
            settings.maxRadius
        );
    }

    calcScaledRadius(distance = this.distance) {
        return map(
            distance,
            settings.minDistance,
            settings.maxDistance,
            this.radius,
            settings.minRadius
        );
    }

    get endSize() {
        return this.calcSize(this.genitalEndHeight);
    }

    get size() {
        return this.calcSize();
    }

    get color() {
        return this.colorManager.color;
    }

    get shape() {
        return this._shape;
    }

    set shape(shape) {
        this._shape = shape;
        this._shape.name = "currentShape";
        this.shapeArr.push(this._shape);
    }

    onReady(): Promise<boolean> {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (this.ready)
                    resolve(this.ready)
                else
                    setTimeout(checkReady, 100)
            }
            checkReady()
        })
    }

    run() {
        // this.ready = this.doneScaling && this.doneGrowing;

        if (!this.doneScaling)
            this.moveTowardScreen();

        else if (!this.doneGrowing)
            this.growGenitalia();

        else if (this.doneScaling && this.doneGrowing) {
            new GenderShape(this)
        }
    }

    genCircle(visible = true, point = this.spawnPoint, radius = this.radius) {
        const circle = new paper.Path.Circle(point, radius);
        circle.name = "Circle";
        if (visible) this.colorManager.applyVisibility(circle);

        this.circleArr.push(circle);
        return circle;
    }

    genGenitalia(height: number, sex = this.sex, apply = true) {
        let value: Genital[];

        switch (sex) {
            case "male": {
                const yPosPenis =
                    this.spawnPoint.y - this.radius + this.genitalWidth / 2;
                value = [this.genPart(height, yPosPenis, "penis")];
                break;
            }

            case "female": {
                const yPosButt =
                    this.spawnPoint.y + this.radius + this.genitalWidth / 2;
                value = [this.genPart(height, yPosButt, "butt")];
                break;
            }

            case "intersex": {
                const yPosPenis =
                    this.spawnPoint.y - this.radius + this.genitalWidth / 2;
                const yPosButt =
                    this.spawnPoint.y + this.radius + this.genitalWidth / 2;
                value = [
                    this.genPart(height, yPosPenis, "penis"),
                    this.genPart(height, yPosButt, "butt"),
                ];
                break;
            }
        }

        if (apply) this.applyGenitalia(value!);
    }

    genPart(height: number, yPos: number, name: string): Genital {
        const xPos = this.spawnPoint.x - this.genitalWidth / 2;

        const part = Appendage(xPos, yPos, this.genitalWidth, height);
        this.appendageArr.push(part);

        return {name: name, path: part};
    }

    growGenitalia() {
        if (this.genitalHeight < this.genitalEndHeight) {
            this.genGenitalia(this.genitalHeight);
            this.genitalHeight += this.growSpeed;
        } else {
            this.doneGrowing = true;
        }
    }

    applyGenitalia(genitals: Genital[]) {
        if (genitals.length > 1) {
            const penis = genitals[0];
            const butt = genitals[1];

            const circle = this.genCircle(false);
            const buttCircle = circle.subtract(butt.path);
            const penisCircle = buttCircle.unite(penis.path);

            buttCircle.name = "buttCircle";
            penisCircle.name = "penisCircle";
            this.colorManager.applyVisibility(penisCircle);

            this.circleArr.push(circle, buttCircle, penisCircle);
            this.shape = penisCircle;
            this.shape.applyMatrix = false;
            this.shape.rotation = this.rotation;

        } else {
            let genitalCircle: paper.PathItem;
            const circle = this.genCircle(false);
            const genital = genitals[0];

            switch (genital.name) {
                case "penis": {
                    genitalCircle = circle.unite(genital.path);
                    genitalCircle.name = "penisCircle";
                    break;
                }

                case "butt": {
                    genitalCircle = circle.subtract(genital.path);
                    genitalCircle.name = "buttCircle";
                    break;
                }
            }

            this.colorManager.applyVisibility(genitalCircle!);
            this.circleArr.push(circle, genitalCircle!);

            this.shape = genitalCircle!;
            this.shape.applyMatrix = false;
            this.shape.rotation = this.rotation;
            return;
        }
    }

    moveTowardScreen() {
        if (this.distance <= 0) {
            this.doneScaling = true;
        } else {
            this.distance -= this.scaleSpeed;
            const circle = this.genCircle(
                true,
                this.spawnPoint,
                this.calcScaledRadius()
            );

            circle.strokeColor!.alpha = this.colorManager.calcAlpha()
            this.shape = circle
        }
    }
}


export class GenderShape {
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

    attractedTo(other: GenderShape): boolean {
        const colorDifference = ColorManager.colorDistance(this.color, other.color)
        // console.log(colorDifference)
        return colorDifference <= settings.attractionThreshold;
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
        this.symbol.shadowColor = color

        this.symbol.shadowBlur = ColorManager.calcShadow(this.size)
        this.symbol.shadowOffset = new paper.Point(0, 0)
    }

    get position() {
        return this.symbol.position;
    }

    set position(position: paper.Point) {
        this.symbol.position = position;
    }

    run() {
        // this.ready = this.doneScaling && this.doneGrowing;
        this.updatePosition();
        this.checkBorders();
    }

    //returns true if out of bounds
    outOfBounds() {
        const bounds = paper.view.bounds;

        return (
            !bounds.contains(this.position) && !this.symbol.bounds.intersects(bounds)
        );
    }

    checkBorders() {
        if (this.outOfBounds()) {
            const center = paper.view.center;
            const dist = this.position.subtract(center).multiply(-1);
            this.position = center.add(dist);
        }
    }

    attractShape(shape: GenderShape) {
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

    seek(target: GenderShape) {
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

        this.applyForce(this.vector);
        this.velocity = this.velocity.add(this.acceleration);
        this.symbol!.position = this.symbol!.position.add(this.velocity);
        this.acceleration = this.acceleration.multiply(0);
    }
}
