import paper from "paper";
import ShapeManager from "./ShapeManager";
import ColorManager from "./ColorManager";
import {map, random} from "./HelperFunctions";
import * as settings from "../Settings";
import AdultShape from "./AdultShape";
import {babyShape, PathArray} from "./Interfaces";

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
    leftLine.simplify()

    return leftLine;
}

export default class BabyShape {
    spawnPoint: paper.Point;
    shapeManager: ShapeManager | undefined;
    colorManager: ColorManager;
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
        circle.simplify()
        circle.name = "Circle";
        if (visible) this.colorManager.applyVisibility(circle);

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

        this.shape.simplify()
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
