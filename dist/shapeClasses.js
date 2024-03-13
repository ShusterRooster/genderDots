import DotManager from "./DotManager.js";
import ColorManager from "./ColorManager.js";
import * as paper from 'paper';
import { consoleLog, constrain, map, random } from "./HelperFunctions";
import { Point, Path } from "paper";
const viewSize = paper.project.view.viewSize;
function Appendage(x, y, width, height) {
    //left line
    const leftLine = new paper.Path.Line({
        name: "leftLine",
        from: [x, y],
        to: [x, y - height]
    });
    //middle arc
    const midArc = new paper.Path.Arc({
        name: "midArc",
        from: [x, y - height],
        through: [x + width / 2, (y - height) - width / 2],
        to: [x + width, y - height]
    });
    //right line
    const rightLine = new paper.Path.Line({
        name: "rightLine",
        from: [x + width, y - height],
        to: [x + width, y]
    });
    //joins paths together then returns
    leftLine.join(midArc);
    leftLine.join(rightLine);
    leftLine.closed = true;
    leftLine.name = "Appendage";
    return leftLine;
}
export default class GenderShape {
    //variables dependent on view being loaded
    point;
    size;
    scalePoint;
    _distance;
    _vector;
    _shape;
    colorMan;
    growSpeed = random(0.5, 1.25);
    scaleSpeed = random(2, 5);
    rotation = random(0, 360);
    penis;
    butt;
    dotManager;
    isGrowing = false;
    doneGrowing = false;
    isScaling = false;
    doneScaling = false;
    acceleration = new Point(0, 0);
    velocity = new Point(0, 0);
    collisionEnabled = false;
    isColliding = false;
    circleArr = [];
    appendageArr = [];
    shapeArr = [];
    lineArr = [];
    radius;
    genitalWidth;
    genitalHeight = 0;
    genitalEndHeight;
    constructor(dotManager, point = Point.random().multiply(viewSize), radius = random(DotManager.minRadius, DotManager.maxRadius), distance = random(DotManager.minDistance, viewSize.width), genitalWidth = random(radius / DotManager.genitalDiv, radius), genitalEndHeight = random(radius / DotManager.genitalDiv, radius), innerColor, outerColor) {
        this.dotManager = dotManager;
        this.point = point;
        this.radius = radius;
        this._distance = distance;
        this.genitalWidth = genitalWidth;
        this.genitalEndHeight = genitalEndHeight;
        this.scalePoint = new Point(random(-viewSize.width, viewSize.width), random(-viewSize.height, viewSize.height));
        this.scaleSpeed = this._distance / this.scalePoint.subtract(this.point).length;
        this.colorMan = new ColorManager(this, innerColor, outerColor);
    }
    applyVisibility(item) {
        item.fillColor = this.innerColor;
        item.shadowColor = this.outerColor;
        item.strokeColor = this.outerColor;
        item.strokeWidth = ColorManager.strokeWidth;
        item.shadowBlur = this.colorManager.shadowBlur;
        item.shadowOffset = new Point(0, 0);
    }
    addToArr(arr, ...args) {
        args.forEach((arg) => {
            arr.push(arg);
        });
        this.cleanUpAll();
    }
    //deletes everything but last element in array unless specified otherwise
    scrubArr(arr, distance = 1) {
        for (let i = 0; i < arr.length - distance; i++) {
            arr[i].remove();
            arr.splice(i, 1);
        }
    }
    cleanUpAll() {
        this.scrubArr(this.appendageArr, 0);
        this.scrubArr(this.circleArr);
        this.scrubArr(this.shapeArr);
        this.scrubArr(this.lineArr);
    }
    get distance() {
        return this._distance;
    }
    set distance(distance) {
        this._distance = distance;
    }
    get vector() {
        return this._vector;
    }
    set vector(vector) {
        const len = constrain(vector.length, DotManager.minVector, DotManager.maxVector);
        this._vector = new Point({ length: len, angle: vector.angle });
        this.drawVector();
    }
    get colorManager() {
        return this.colorMan;
    }
    get innerColor() {
        return this.colorManager.innerColor;
    }
    set innerColor(color) {
        this.colorManager.innerColor = color;
        this.applyVisibility(this.shape);
    }
    get outerColor() {
        return this.colorManager.outerColor;
    }
    set outerColor(color) {
        this.colorManager.outerColor = color;
        this.applyVisibility(this.shape);
    }
    get position() {
        return this.shape.position;
    }
    set position(position) {
        this.shape.position = position;
    }
    get shape() {
        return this._shape;
    }
    set shape(shape) {
        this._shape = shape;
        this._shape.name = "currentShape";
        this.shapeArr.push(this._shape);
        this.addToArr(this.shapeArr, this._shape);
    }
    get infoString() {
        let str = `point: ${this.point}<br>`;
        if (this.shape !== null) {
            str += `shape: ${this.position}<br>`;
            if (this.vector !== null) {
                str += `vector: ${this.vector}<br>acc: ${this.acceleration}<br>vel: ${this.velocity}`;
            }
        }
        return str;
    }
    run() {
        this.iterate();
        if (!this.doneScaling) {
            this.moveTowardScreen();
        }
        else {
            this.growGenitalia();
            this.collisionEnabled = true;
            this.generateFirstVector();
            this.updatePosition();
        }
    }
    iterate() {
        // add sync functions here when needed
    }
    genCircle(visible = true, point = this.point, radius = this.radius) {
        const circle = new Path.Circle(point, radius);
        circle.name = "Circle";
        if (visible) {
            this.applyVisibility(circle);
        }
        this.addToArr(this.circleArr, circle);
        return circle;
    }
    collisionDetected(value = true) {
        this.isColliding = value;
        this.shape.fillColor = "pink";
    }
    genGenitalia(height) {
        const tolerance = this.genitalWidth / 2;
        const xPos = this.point.x - this.genitalWidth / 2;
        const yPosButt = this.point.y + this.radius + tolerance;
        const yPosPenis = this.point.y - this.radius + tolerance;
        this.penis = Appendage(xPos, yPosPenis, this.genitalWidth, height);
        this.butt = Appendage(xPos, yPosButt, this.genitalWidth, height);
        this.addToArr(this.appendageArr, this.penis, this.butt);
    }
    growGenitalia() {
        if (this.genitalHeight < this.genitalEndHeight) {
            this.genGenitalia(this.genitalHeight);
            this.genitalHeight += this.growSpeed;
            this.isGrowing = true;
        }
        else {
            this.isGrowing = false;
            this.doneGrowing = true;
        }
        const circle = this.genCircle(false);
        const buttCircle = circle.subtract(this.butt);
        const penisCircle = buttCircle.unite(this.penis);
        buttCircle.name = 'buttCircle';
        penisCircle.name = 'penisCircle';
        this.applyVisibility(penisCircle);
        this.addToArr(this.circleArr, circle, buttCircle, penisCircle);
        penisCircle.rotation = this.rotation;
        this.shape = penisCircle;
    }
    //returns true if out of bounds
    outOfBounds() {
        const viewBounds = paper.project.view.bounds;
        return !viewBounds.contains(this.position);
    }
    //TODO GET WORKING
    checkBorders() {
        if (this.outOfBounds()) {
            const center = paper.project.view.center;
            const dist = this.position.subtract(center).multiply(-1);
            this.position = center.add(dist);
        }
    }
    //TODO suck my fart balls
    moveTowardScreen() {
        const view = paper.project.view.bounds;
        const half = new paper.Point(view.width / 2, view.height / 2);
        const scaleDiff = this.point.subtract(this.scalePoint);
        // consoleLog("scaleDiff", scaleDiff)
        // consoleLog("scaleSpeed", this.#scaleSpeed)
        consoleLog("scaleDiv", scaleDiff.divide(this.scaleSpeed));
        consoleLog("scaleSpeed", this.scaleSpeed);
        const scaleX = map(this.scalePoint.x / this.distance, 0, 1, 0, view.width);
        const scaleY = map(this.scalePoint.y / this.distance, 0, 1, 0, view.height);
        let point = new Point(scaleX, scaleY);
        const radius = map(this.distance, 0, view.width, this.radius, DotManager.minRadius);
        if (this.distance < DotManager.minDistance) {
            this.doneScaling = true;
            // console.log("done scaling")
            // console.log(`scaleX: ${scaleX}`)
            // console.log(`scaleY: ${scaleY}`)
        }
        else {
            this.distance -= this.scaleSpeed;
            this.scalePoint = this.scalePoint.add(scaleDiff.divide(this.scaleSpeed));
            this.shape = this.genCircle(true, point, radius);
            // this.shape.translate(half)
        }
    }
    drawVector() {
        const end = this.position.add(this.vector);
        const line = new paper.Path.Line(this.position, end);
        // @src-ignore
        line.strokeColor = "red";
    }
    //runs only once to generate the first vector
    generateFirstVector() {
        if (this.vector == null) {
            const minSize = DotManager.minRadius * ((DotManager.minRadius / 5) ** 2);
            const maxSize = DotManager.maxRadius ** 3;
            const size = this.genitalWidth * this.genitalEndHeight * this.radius;
            this.size = map(size, minSize, maxSize, DotManager.minRadius, DotManager.maxRadius);
            const length = random(DotManager.minVector, DotManager.maxVector);
            this.vector = new paper.Point({ length: length, angle: this.rotation - 90 });
            consoleLog("size", this.size);
            consoleLog("vector", this.vector.length);
            consoleLog("div", this.size / this.vector.length);
        }
    }
    attractShape(shape) {
        const G = 6.67428 * (10 ** -11);
        let force = this.position.subtract(shape.position);
        const distance = constrain(force.length, DotManager.minVector, DotManager.maxVector);
        const strength = (G * this.size * shape.size) / distance ** 2;
        shape.applyForce(force.normalize(strength));
    }
    applyForce(force) {
        this.acceleration = this.acceleration.add(force.divide(this.size));
    }
    updatePosition() {
        const dragMag = DotManager.friction * (this.velocity.length ** 2);
        const drag = this.velocity.multiply(-DotManager.friction).normalize(dragMag);
        // this.applyForce(drag)
        this.applyForce(this.vector);
        this.velocity = this.velocity.add(this.acceleration);
        this.shape.position = this.shape.position.add(this.velocity);
        this.acceleration = this.acceleration.multiply(0);
        // this.checkBorders()
    }
}
