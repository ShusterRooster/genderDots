import DotManager from "./DotManager";
import ColorManager from "./ColorManager";
import {consoleLog, constrain, map, random} from "./HelperFunctions";
import paper from "paper";

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

        if(len > this.cleanDist){
            for (let i = 0; i < len - this.cleanDist; i++) {
                this.arr[i].remove()
            }
        }

        this.arr = this.arr.slice(len - this.cleanDist)
    }

    print(text?: string){
        if(text)
            console.log(`${text}, ${this.name}: ${this.arr}`)
        else
            console.log(`${this.name}: [${this.arr}]`)
    }
}

export default class GenderShape {
    //variables dependent on view being loaded
    point: paper.Point

    protected scalePoint: paper.Point
    protected _distance: number
    protected _vector = new paper.Point(0, 0)
    protected _shape: any
    protected colorMan: ColorManager

    protected growSpeed = random(0.5, 1.25)
    protected scaleSpeed = random(2, 5)
    protected rotation = random(0, 360)

    dotManager: DotManager

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
                point = paper.Point.random().multiply(paper.view.viewSize),
                radius = random(DotManager.minRadius, DotManager.maxRadius),
                distance = random(DotManager.minDistance, paper.view.viewSize.width),
                genitalWidth = random(radius / DotManager.genitalDiv, radius),
                genitalEndHeight = random(radius / DotManager.genitalDiv, radius),
                innerColor?: paper.Color,
                outerColor?: paper.Color) {

        this.dotManager = dotManager
        this.point = point
        this.radius = radius
        this._distance = distance
        this.genitalWidth = genitalWidth
        this.genitalEndHeight = genitalEndHeight

        this.scalePoint = new paper.Point(
            random(-paper.view.viewSize.width, paper.view.viewSize.width),
            random(-paper.view.viewSize.height, paper.view.viewSize.height))

        console.log(this.scalePoint)

        this.scaleSpeed = this._distance / this.scalePoint.subtract(this.point).length
        this.colorMan = new ColorManager(this, innerColor, outerColor)
    }

    protected applyVisibility(item: paper.Path | paper.PathItem) {
        item.fillColor = this.innerColor
        item.shadowColor = this.outerColor
        item.strokeColor = this.outerColor
        item.strokeWidth = ColorManager.strokeWidth

        item.shadowBlur = this.colorManager.shadowBlur
        item.shadowOffset = new paper.Point(0, 0)
    }

    //runs only once to generate the first vector
    protected generateFirstVector() {
        if (this.vector == null) {
            const length = random(DotManager.minVector, DotManager.maxVector)
            this.vector = new paper.Point({length: length, angle: this.rotation - 90})

            consoleLog("size", this.size)
            consoleLog("vector", this.vector.length)
            consoleLog("div", this.size / this.vector.length)
        }
    }

    drawLineTo(point: paper.Point, color: paper.Color | string = "red"){
        const line = new paper.Path.Line(this.shape.position, point)
        // @ts-ignore
        line.strokeColor = color
        this.lineArr.push(line)
    }

    calcSize(height = this.genitalHeight){
        const minSize = DotManager.minRadius * ((DotManager.minRadius / 5) ** 2)
        const maxSize = DotManager.maxRadius ** 3

        const size = this.genitalWidth * height * this.radius
        return map(size, minSize, maxSize, DotManager.minRadius, DotManager.maxRadius)
    }

    get endSize(){
        return this.calcSize(this.genitalEndHeight)
    }

    get size(){
        return this.calcSize()
    }

    get distance(){
        return this._distance
    }

    set distance(distance: number){
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

    get colorManager() {
        return this.colorMan
    }

    get innerColor() {
        return this.colorManager.innerColor
    }

    set innerColor(color: paper.Color) {
        this.colorManager.innerColor = color
        this.applyVisibility(this.shape)
    }

    get outerColor() {
        return this.colorManager.outerColor
    }

    set outerColor(color: paper.Color) {
        this.colorManager.outerColor = color
        this.applyVisibility(this.shape)
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
        let str = `point: ${this.point}<br>`

        if (this.shape !== null) {
            str += `shape: ${this.position}<br>`
            if (this.vector !== null) {
                str += `vector: ${this.vector}<br>acc: ${this.acceleration}<br>vel: ${this.velocity}`
            }
        }

        return str
    }

    run() {
        this.iterate()

        if (!this.doneScaling) {
            this.moveTowardScreen()
        } else {
            this.growGenitalia()
            this.collisionEnabled = true
            this.generateFirstVector()
            this.updatePosition()
        }
    }

    iterate() {
        // add sync functions here when needed
    }

    genCircle(visible = true, point = this.point, radius = this.radius) {
        const circle = new paper.Path.Circle(point, radius)
        circle.name = "Circle"

        if (visible) {
            this.applyVisibility(circle)
        }

        this.circleArr.push(circle)
        return circle
    }

    collisionDetected(value = true) {
        this.isColliding = value
        this.shape.fillColor = "pink"
    }

    genGenitalia(height: number, apply = true) {
        const tolerance = this.genitalWidth / 2
        const xPos = this.point.x - this.genitalWidth / 2
        const yPosButt = this.point.y + this.radius + tolerance
        const yPosPenis = this.point.y - this.radius + tolerance

        const penis = Appendage(xPos, yPosPenis, this.genitalWidth, height)
        const butt = Appendage(xPos, yPosButt, this.genitalWidth, height)
        this.appendageArr.push(penis, butt)

        const genitalia = {penis: penis, butt: butt}
        if(apply) this.applyGenitalia(genitalia)

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

    applyGenitalia(genitalia: {penis: paper.Path, butt: paper.Path}){
        const circle = this.genCircle(false)
        const buttCircle = circle.subtract(genitalia.butt)
        const penisCircle = buttCircle.unite(genitalia.penis)

        buttCircle.name = 'buttCircle'
        penisCircle.name = 'penisCircle'
        this.applyVisibility(penisCircle)

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
            const center = paper.project.view.center
            const dist = this.position.subtract(center).multiply(-1)
            this.position = center.add(dist)
        }
    }


    //TODO suck my fart balls
    moveTowardScreen() {
        const view = paper.project.view.bounds
        const half = new paper.Point(view.width / 2, view.height / 2)
        const scaleDiff = this.point.subtract(this.scalePoint)

        const scaleX = map(this.scalePoint.x / this.distance, 0, 1, 0, view.width)
        const scaleY = map(this.scalePoint.y / this.distance, 0, 1, 0, view.height)
        let point = new paper.Point(scaleX, scaleY)
        const radius = map(this.distance, 0, view.width, this.radius, DotManager.minRadius)

        if (this.distance < DotManager.minDistance) {
            this.doneScaling = true
            // console.log("done scaling")
            // console.log(`scaleX: ${scaleX}`)
            // console.log(`scaleY: ${scaleY}`)
        } else {
            this.distance -= this.scaleSpeed

            // this.scalePoint = this.scalePoint.add(scaleDiff.divide(this.scaleSpeed))
            point = point.add(scaleDiff.divide(this.scaleSpeed))


            this.shape = this.genCircle(true, point, radius)
            this.drawLineTo(this.scalePoint)
            // this.shape.translate(half)
        }
    }

    attractShape(shape: GenderShape) {
        const G  = 6.67428 * (10 ** -11)
        let force = this.position.subtract(shape.position)
        const distance = constrain(force.length, DotManager.minVector, DotManager.maxVector)
        const strength = (G * this.size * shape.size) / distance ** 2

        shape.applyForce(force.normalize(strength))
    }

    applyForce(force: paper.Point) {
        this.acceleration = this.acceleration.add(force.divide(this.size))
    }

    updatePosition() {
        const dragMag = DotManager.friction * (this.velocity.length ** 2)
        const drag = this.velocity.multiply(-DotManager.friction).normalize(dragMag)
        // this.applyForce(drag)

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