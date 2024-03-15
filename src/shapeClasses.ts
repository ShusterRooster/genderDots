import DotManager from "./DotManager";
import ColorManager from "./ColorManager";
import {consoleLog, constrain, map, random} from "./HelperFunctions";
import paper, {view} from "paper";

function Appendage(x: number,
                   y: number,
                   width: number,
                   height: number): paper.Path.Line {

    const leftLine = new paper.Path.Line({
        name: "leftLine",
        from: [x, y],
        to: [x, y - height]
    })

    const midArc = new paper.Path.Arc({
        name: "midArc",
        from: [x, y - height],
        through: [x + width / 2, (y - height) - width / 2],
        to: [x + width, y - height]
    })

    const rightLine = new paper.Path.Line({
        name: "rightLine",
        from: [x + width, y - height],
        to: [x + width, y]
    })

    //joins paths together then returns
    leftLine.join(midArc)
    leftLine.join(rightLine)

    leftLine.closed = true
    leftLine.name = "Appendage"

    return leftLine
}

class PathArray {
    name: string
    arr: paper.Path[]
    cleanDist: number

    constructor(name: string, cleanDist = 1) {
        this.name = name
        this.arr = []
        this.cleanDist = cleanDist
    }

    push(...args: any[]) {
        args.forEach((arg) => {
            this.arr.push(arg)
        })

        this.scrubArr()
    }

    //deletes everything but last element in array unless specified otherwise
    scrubArr() {
        const len = this.arr.length

        if (len > this.cleanDist) {
            for (let i = 0; i < len - this.cleanDist; i++) {
                this.arr[i].remove()
            }
        }

        this.arr = this.arr.slice(len - this.cleanDist)
    }

    print(text?: string) {
        if (text)
            console.log(`${text}, ${this.name}: ${this.arr}`)
        else
            console.log(`${this.name}: [${this.arr}]`)
    }
}

export default class GenderShape {
    spawnPoint: paper.Point
    dotManager: DotManager
    colorManager: ColorManager

    protected _distance: number
    protected _vector = new paper.Point(0, 0)
    protected _shape: any

    protected scaleSpeed: number
    protected growSpeed: number
    protected rotation = random(0, 360)

    isGrowing = false
    doneGrowing = false
    isScaling = false
    doneScaling = false

    acceleration = new paper.Point(0, 0)
    velocity = new paper.Point(0, 0)

    collisionEnabled = false
    isColliding = false

    circleArr = new PathArray("circleArr")
    shapeArr = new PathArray("shapeArr")
    lineArr = new PathArray("lineArr")
    appendageArr = new PathArray("appendageArr", 0)

    radius: number
    genitalWidth: number
    genitalHeight = 0
    genitalEndHeight: number

    constructor(dotManager: DotManager,
                spawnPoint = paper.Point.random().multiply(paper.view.viewSize),
                radius = random(DotManager.minRadius, DotManager.maxRadius),
                distance = random(DotManager.minDistance, DotManager.maxDistance),
                genitalWidth = random(radius / DotManager.genitalDiv, radius),
                genitalEndHeight = random(radius / DotManager.genitalDiv, radius),
                color?: paper.Color) {

        this.dotManager = dotManager
        this.spawnPoint = spawnPoint
        this.radius = radius
        this._distance = distance
        this.genitalWidth = genitalWidth
        this.genitalEndHeight = genitalEndHeight

        this.scaleSpeed = DotManager.baseScaleSpeed * (1 - (this.distance / DotManager.maxDistance))
        this.growSpeed = (this.genitalWidth * this.genitalEndHeight) / ((DotManager.maxRadius / DotManager.genitalDiv) ** 2)

        consoleLog("scale", this.scaleSpeed)
        consoleLog("grow", this.growSpeed)

        this.colorManager = new ColorManager(this, color)
    }

    //runs only once to generate the first vector
    protected generateFirstVector() {
        const length = random(DotManager.minVector, DotManager.maxVector)
        this.vector = new paper.Point({length: length, angle: this.rotation - 90})
    }

    protected determineGender(){

    }

    drawLineTo(point: paper.Point, color: paper.Color | string = "red") {
        const line = new paper.Path.Line(this.shape.position, point)
        // @ts-ignore
        line.strokeColor = color
        this.lineArr.push(line)
    }

    calcSize(height = this.genitalHeight) {
        const size = this.genitalWidth * height * this.radius
        return map(size, DotManager.minSize, DotManager.maxSize, DotManager.minRadius, DotManager.maxRadius)
    }

    calcScaledRadius(distance = this.distance) {
        return map(distance, DotManager.minDistance, DotManager.maxDistance, this.radius, DotManager.minRadius)
    }

    get endSize() {
        return this.calcSize(this.genitalEndHeight)
    }

    get size() {
        return this.calcSize()
    }

    get distance() {
        return this._distance
    }

    set distance(distance: number) {
        this._distance = distance
    }

    get vector() {
        return this._vector
    }

    set vector(vector) {
        const len = constrain(vector.length, DotManager.minVector, DotManager.maxVector)
        this._vector = new paper.Point({length: len, angle: vector.angle})

        this.drawLineTo(this.position.add(this._vector))
    }

    get color() {
        return this.colorManager.color
    }

    get position() {
        return this.shape.position
    }

    set position(position: paper.Point) {
        this.shape.position = position
    }

    get shape() {
        return this._shape
    }

    set shape(shape) {
        this._shape = shape
        this._shape.name = "currentShape"
        this.shapeArr.push(this._shape)
    }

    get infoString() {
        let str = `point: ${this.spawnPoint}<br>`

        if (this.shape !== null) {
            str += `shape: ${this.position}<br>`
            if (this.vector !== null) {
                str += `vector: ${this.vector}<br>acc: ${this.acceleration}<br>vel: ${this.velocity}`
            }
        }

        return str
    }

    run() {
        if (!this.doneScaling) {
            this.moveTowardScreen()
        } else {
            this.growGenitalia()
            this.collisionEnabled = true
            this.generateFirstVector()
            this.updatePosition()
        }
    }

    genCircle(visible = true, point = this.spawnPoint, radius = this.radius) {
        const circle = new paper.Path.Circle(point, radius)
        circle.name = "Circle"
        if (visible) this.colorManager.applyVisibility(circle)

        this.circleArr.push(circle)
        return circle
    }

    collisionDetected(value = true) {
        this.isColliding = value
        this.shape.fillColor = "pink"
    }

    genGenitalia(height: number, apply = true) {
        const tolerance = this.genitalWidth / 2
        const xPos = this.spawnPoint.x - this.genitalWidth / 2
        const yPosButt = this.spawnPoint.y + this.radius + tolerance
        const yPosPenis = this.spawnPoint.y - this.radius + tolerance

        const penis = Appendage(xPos, yPosPenis, this.genitalWidth, height)
        const butt = Appendage(xPos, yPosButt, this.genitalWidth, height)
        this.appendageArr.push(penis, butt)

        const genitalia = {penis: penis, butt: butt}
        if (apply) this.applyGenitalia(genitalia)

        return genitalia
    }

    growGenitalia() {
        if (this.genitalHeight < this.genitalEndHeight) {
            this.genGenitalia(this.genitalHeight)
            this.genitalHeight += this.growSpeed
            this.isGrowing = true
        } else {
            this.isGrowing = false
            this.doneGrowing = true
        }
    }

    applyGenitalia(genitalia: { penis: paper.Path, butt: paper.Path }) {
        const circle = this.genCircle(false)
        const buttCircle = circle.subtract(genitalia.butt)
        const penisCircle = buttCircle.unite(genitalia.penis)

        buttCircle.name = 'buttCircle'
        penisCircle.name = 'penisCircle'
        this.colorManager.applyVisibility(penisCircle)

        this.circleArr.push(circle, buttCircle, penisCircle)
        penisCircle.rotation = this.rotation
        this.shape = penisCircle
    }

    //returns true if out of bounds
    outOfBounds() {
        const viewBounds = paper.view.bounds
        return !viewBounds.contains(this.position)
    }


    //TODO GET WORKING
    checkBorders() {
        if (this.outOfBounds()) {
            const center = paper.view.center
            const dist = this.position.subtract(center).multiply(-1)
            this.position = center.add(dist)
        }
    }

    gemini() {
        const center = paper.view.center

        const centerDist = this.spawnPoint.subtract(center)
        const dist = Math.sqrt((centerDist.x ** 2) + (centerDist.y ** 2))

        this.spawnPoint.x -= centerDist.x * this.scaleSpeed / dist
        this.spawnPoint.y -= centerDist.y * this.scaleSpeed / dist

        const radius = Math.max(1, 20 / dist)

        this.shape = this.genCircle(true, this.spawnPoint, radius)
        this.drawLineTo(center)
    }

    moveTowardScreen() {
        if (this.distance <= 0) {
            this.doneScaling = true
        } else {
            this.distance -= this.scaleSpeed
            this.shape = this.genCircle(true, this.spawnPoint, this.calcScaledRadius())
        }
    }

    attractShape(shape: GenderShape) {
        const G = 6.67428 * (10 ** -11)
        let force = this.position.subtract(shape.position)
        const distance = constrain(force.length, DotManager.minVector, DotManager.maxVector)
        const strength = (G * this.size * shape.size) / distance ** 2

        shape.applyForce(force.normalize(strength))
    }

    applyForce(force: paper.Point) {
        this.acceleration = this.acceleration.add(force.divide(this.size))
    }

    updatePosition() {
        if (!this.vector) this.generateFirstVector()

        const dragMag = DotManager.friction * (this.velocity.length ** 2)
        const drag = this.velocity.multiply(-DotManager.friction).normalize(dragMag)
        this.applyForce(drag)

        this.applyForce(this.vector)
        this.velocity = this.velocity.add(this.acceleration)
        this.shape.position = this.shape.position.add(this.velocity)
        this.acceleration = this.acceleration.multiply(0)

        // this.checkBorders()
    }

    // react(other) {
    //     var overlap = this.radius + b.radius - dist;
    //     var direc = (this.point - b.point).normalize(overlap * 0.015);
    //     this.vector += direc;
    //     b.vector -= direc;
    // }
}