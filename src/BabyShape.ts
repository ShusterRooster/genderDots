import paper from "paper";
import ShapeManager from "./ShapeManager";
import {determineProb, map, random} from "./HelperFunctions";
import * as settings from "../Settings";
import {
    genitalDiv,
    lonerChance,
    maxDistance,
    maxSize,
    maxThickness,
    minDistance,
    minGray,
    minSize,
    minThickness
} from "../Settings";
import AdultShape from "./AdultShape";
import PathArray from "./PathArray";

interface Genital {
    name: string;
    path: paper.Path.Line;
}

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

export interface babyShape {
    shapeManager?: ShapeManager;
    spawnPoint?: paper.Point;
    radius?: number;
    distance?: number;
    rotation?: number;
    strokeWidth?: number;
    sex?: string;
    genitalWidth?: number;
    genitalEndHeight?: number;
    color?: paper.Color;
}

export default class BabyShape {
    spawnPoint: paper.Point;
    shapeManager: ShapeManager | undefined;
    color: paper.Color
    sex: string;

    distance: number;
    protected _shape: any;

    protected scaleSpeed: number;
    protected growSpeed: number;
    rotation = random(0, 360);

    doneGrowing = false;
    doneScaling = false;

    circleArr = new PathArray("circleArr");
    shapeArr = new PathArray("shapeArr");
    appendageArr = new PathArray("appendageArr", 0);

    radius: number;
    genitalWidth: number;
    genitalHeight = 0;
    genitalEndHeight: number;
    isLoner = determineProb(lonerChance)
    strokeWidth = random(minThickness, maxThickness)
    shapeBounds?: paper.Rectangle

    constructor(shape: babyShape) {
        this.shapeManager = shape.shapeManager;
        this.spawnPoint =
            shape.spawnPoint ?? paper.Point.random().multiply(paper.view.viewSize);

        this.rotation = shape.rotation ?? this.rotation
        this.strokeWidth = shape.strokeWidth ?? this.strokeWidth

        this.radius =
            shape.radius ?? random(settings.minRadius, settings.maxRadius);

        this.distance =
            shape.distance ?? random(minDistance, maxDistance);

        this.sex = shape.sex ?? BabyShape.determineSex();

        this.genitalWidth =
            shape.genitalWidth ??
            random(this.radius / genitalDiv, this.radius);

        this.genitalEndHeight =
            shape.genitalEndHeight ??
            random(this.radius / genitalDiv, this.radius);

        this.scaleSpeed =
            settings.baseScaleSpeed * (1 - this.distance / maxDistance);

        this.growSpeed =
            map(this.endSize, minSize, maxSize, settings.minGrowSpeed, settings.maxGrowSpeed)


        this.color = shape.color || paper.Color.random()
        if (this.isLoner) this.color = this.generateGray()
    }

    run() {
        if (!this.doneScaling)
            this.moveTowardScreen();

        else if (!this.doneGrowing)
            this.growGenitalia();

        else if (this.doneScaling) {
            new AdultShape(this)
        }
    }

    genCircle(visible = true, point = this.spawnPoint, radius = this.radius) {
        const circle = new paper.Path.Circle(point, radius);
        // circle.simplify()
        circle.name = "Circle";
        if (visible) this.applyVisibility(circle);

        this.circleArr.push(circle);
        return circle;
    }

    growGenitalia() {
        if (this.genitalHeight < this.genitalEndHeight) {
            this.genGenitalia(this.genitalHeight);
            this.genitalHeight += this.growSpeed;
        } else {
            this.doneGrowing = true;
        }
    }

    genGenitalia(height: number, sex = this.sex, apply = true) {
        let value: Genital[];

        const yPosPenis = this.spawnPoint.y - this.radius + this.genitalWidth / 2;
        const yPosButt = this.spawnPoint.y + this.radius + this.genitalWidth / 2;

        switch (sex) {
            case "male": {
                value = [this.genPart(height, yPosPenis, "penis")];
                break;
            }

            case "female": {
                value = [this.genPart(height, yPosButt, "butt")];
                break;
            }

            case "intersex": {
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

    applyGenitalia(genitals: Genital[]) {
        if (genitals.length > 1) {
            const penis = genitals[0];
            const butt = genitals[1];

            const circle = this.genCircle(false);
            const buttCircle = circle.subtract(butt.path);
            const penisCircle = buttCircle.unite(penis.path);

            buttCircle.name = "buttCircle";
            penisCircle.name = "penisCircle";
            this.applyVisibility(penisCircle);

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

            this.applyVisibility(genitalCircle!);
            this.circleArr.push(circle, genitalCircle!);

            this.shape = genitalCircle!;
            this.shape.applyMatrix = false;
            this.shape.rotation = this.rotation;
        }

        // this.shape.applyMatrix = false;
        this.shape.rotation = this.rotation;
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

            circle.strokeColor!.alpha = this.calcAlpha()
            this.shape = circle
        }
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

    applyVisibility(item: paper.Path | paper.PathItem = this.shape) {
        item.strokeColor = this.color
        item.strokeWidth = this.strokeWidth
        item.strokeColor.alpha = this.calcAlpha()
    }

    generateGray(gray = random(0, minGray)) {
        return new paper.Color(gray)
    }

    calcAlpha(distance = this.distance) {
        return map(distance, 0, maxDistance, 1, 0)
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

    get shape() {
        return this._shape;
    }

    set shape(shape) {
        this._shape = shape;
        this.shapeBounds = shape.bounds

        this._shape.position = this.spawnPoint
        this._shape.pivot = this.spawnPoint

        this._shape.name = "currentShape";
        this.shapeArr.push(this._shape);
    }
}
