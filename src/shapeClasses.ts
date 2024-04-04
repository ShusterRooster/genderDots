import paper from "paper";
import ColorManager from "./ColorManager";
import DotManager from "./DotManager";
import {
    between,
    constrain,
    map,
    PathArray,
    random,
    randomFromArr
} from "./HelperFunctions";
import {Relationship} from "./Relationship";
import * as settings from "../Settings"

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

export interface genderShape {
    dotManager?: DotManager;
    spawnPoint?: paper.Point;
    radius?: number;
    distance?: number;
    sex?: string;
    genitalWidth?: number;
    genitalEndHeight?: number;
    color?: paper.Color;
}

export default class GenderShape {
    spawnPoint: paper.Point;
    dotManager: DotManager | undefined;
    colorManager: ColorManager;
    sex: string;

    distance: number;
    protected _vector: paper.Point | undefined;
    protected _shape: any;

    protected scaleSpeed: number;
    protected growSpeed: number;
    protected rotation = random(0, 360);

    doneGrowing = false;
    doneScaling = false;
    ready = false;

    acceleration = new paper.Point(0, 0);
    velocity = new paper.Point(0, 0);

    collisionEnabled = false;
    isColliding = false;

    circleArr = new PathArray("circleArr");
    shapeArr = new PathArray("shapeArr");
    lineArr = new PathArray("lineArr");
    appendageArr = new PathArray("appendageArr", 0);

    relationship: Relationship | undefined;
    attrFactor = random(settings.minAttrFactor, settings.maxAttrFactor);
    isLoner = Math.random() * 100 <= settings.lonerChance;

    radius: number;
    genitalWidth: number;
    genitalHeight = 0;
    genitalEndHeight: number;

    constructor(shape: genderShape) {
        this.dotManager = shape.dotManager;
        this.spawnPoint =
            shape.spawnPoint ?? paper.Point.random().multiply(paper.view.viewSize);

        this.radius =
            shape.radius ?? random(settings.minRadius, settings.maxRadius);

        this.distance =
            shape.distance ?? random(settings.minDistance, settings.maxDistance);

        this.sex = shape.sex ?? GenderShape.determineSex();

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
    }

    //runs only once to generate the first vector
    protected generateFirstVector() {
        const length = random(settings.minVector, settings.maxVector);
        this.vector = new paper.Point({
            length: length,
            angle: this.rotation - 90,
        });
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

    attractedTo(other: GenderShape): boolean {
        // Absolute difference between the colors
        const colorDifference = Math.abs(this.gray - other.gray);

        // Objects are attracted if:
        // 1. Color difference is within the threshold
        // 2. At least one object is very light or very dark (not in the middle)
        // 3. They are not exactly the same color
        return (colorDifference <= settings.attractionThreshold &&
                (this.gray <= 0.4 || this.gray >= 0.8 ||
                    other.gray <= 0.4 || other.gray >= 0.8)) &&
            (this.gray !== other.gray);
    }




    drawLineTo(point: paper.Point, color: paper.Color | string = "red") {
        const line = new paper.Path.Line(this.shape.position, point);
        // @ts-ignore
        line.strokeColor = color;
        this.lineArr.push(line);
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

    get color() {
        return this.colorManager.color;
    }

    get gray() {
        return this.colorManager.gray;
    }

    get position() {
        return this.shape.position;
    }

    set position(position: paper.Point) {
        this.shape.position = position;
    }

    get shape() {
        return this._shape;
    }

    set shape(shape) {
        this._shape = shape;
        this._shape.name = "currentShape";
        this.shapeArr.push(this._shape);
    }

    get infoString() {
        let str = `point: ${this.spawnPoint}<br>`;

        if (this.shape !== null) {
            str += `shape: ${this.position}<br>`;
            if (this.vector !== null) {
                str += `vector: ${this.vector}<br>acc: ${this.acceleration}<br>vel: ${this.velocity}`;
            }
        }

        return str;
    }

    checkReady() {
        this.ready = this.doneScaling && this.doneGrowing;
        if (this.ready) Relationship.pairShapes(this.dotManager!.arr);
    }

    run() {
        this.checkReady();

        if (this.relationship !== undefined) this.relationship.run();

        if (!this.doneScaling) {
            this.moveTowardScreen();
        } else {
            this.growGenitalia();
            this.collisionEnabled = true;
            this.updatePosition();
        }
    }

    genCircle(visible = true, point = this.spawnPoint, radius = this.radius) {
        const circle = new paper.Path.Circle(point, radius);
        circle.name = "Circle";
        if (visible) this.colorManager.applyVisibility(circle);

        this.circleArr.push(circle);
        return circle;
    }

    genPart(height: number, yPos: number, name: string): Genital {
        const xPos = this.spawnPoint.x - this.genitalWidth / 2;

        const part = Appendage(xPos, yPos, this.genitalWidth, height);
        this.appendageArr.push(part);

        return {name: name, path: part};
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
        }
    }

    //returns true if out of bounds
    outOfBounds() {
        const bounds = paper.view.bounds;

        return (
            !bounds.contains(this.position) && !this.shape.bounds.intersects(bounds)
        );
    }

    checkBorders() {
        if (this.outOfBounds()) {
            const center = paper.view.center;
            const dist = this.position.subtract(center).multiply(-1);
            this.position = center.add(dist);
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

    attractShape(shape: GenderShape) {
        if (this.ready) {
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
    }

    applyForce(force: paper.Point | undefined, heading = false) {
        const calc = force!.divide(this.size);

        if (calc.length > settings.maxVector)
            calc.normalize(settings.maxVector);

        this.acceleration = this.acceleration.add(force!.divide(this.size));

        if (heading) this.pointTowards(force!.angle);
    }

    collisionDetected() {
        this.isColliding = true;
        this.shape.fillColor = "pink";
    }

    pointTowards(angle: number) {
        angle += 90;

        const mod = ((angle - this.shape.rotation) / 180) * settings.maxForce;
        this.shape.rotation += mod;
    }

    seek(target: GenderShape | paper.Point) {
        if (this.ready) {
            let desired: paper.Point;

            desired =
                target instanceof GenderShape
                    ? target.shape.position.subtract(this.position)
                    : target.subtract(this.position);

            const d = desired.length;

            if (d < this.radius * 2) {
                const m = map(d, 0, this.radius * 2, 0, settings.maxVector);
                desired.normalize(m);
            } else {
                desired.normalize(settings.maxVector);
            }

            let steer = desired.subtract(this.velocity);
            this.applyForce(steer);

            this.pointTowards(desired.angle);
        }
    }

    updatePosition() {
        if (!this.vector) this.generateFirstVector();

        const dragMag = settings.friction * this.velocity.length ** 2;
        const drag = this.velocity
            .multiply(-settings.friction)
            .normalize(dragMag);
        this.applyForce(drag);

        this.applyForce(this.vector);
        this.velocity = this.velocity.add(this.acceleration);
        this.shape.position = this.shape.position.add(this.velocity);
        this.acceleration = this.acceleration.multiply(0);

        this.checkBorders();
    }
}
