import DotManager from "./DotManager.js";
import ColorManager from "./ColorManager.js";

function Appendage(x, y, radius, width, height) {
    this.x = x
    this.y = y
    this.radius = radius
    this.width = width
    this.height = height

    //left line
    const leftLine = new paper.Path.Line({
        name: "leftLine",
        from: [this.x, this.y],
        to: [this.x, this.y - this.height]
    })

    //middle arc
    const midArc = new paper.Path.Arc({
        name: "midArc",
        from: [this.x, this.y - this.height],
        through: [this.x + this.width / 2, (this.y - this.height) - this.width / 2],
        to: [this.x + this.width, this.y - this.height]
    })

    //right line
    const rightLine = new paper.Path.Line({
        name: "rightLine",
        from: [this.x + this.width, this.y - this.height],
        to: [this.x + this.width, this.y]
    })

    //joins paths together then returns
    leftLine.join(midArc)
    leftLine.join(rightLine)

    leftLine.closed = true
    leftLine.name = "Appendage"

    return leftLine
}

export default class GenderShape {
    //variables dependent on view being loaded
    point
    #scalePoint
    #distanceObj

    #rotation = random(0, 360)
    isGrowing = false
    doneGrowing = false

    isScaling = false
    doneScaling = false

    #growSpeed = random(0.5, 1.25)
    #scaleSpeed = random(2, 5)

    size
    acceleration = new paper.Point(0, 0)
    velocity = new paper.Point(0, 0)
    #vector

    collisionEnabled = false
    isColliding = false

    circleArr = []
    appendageArr = []
    shapeArr = []
    lineArr = []

    #currentShape
    #colorMan
    dotManager

    constructor(dotManager, point, radius, distance, gender, genitalWidth, genitalHeight, innerColor, outerColor) {
        this.dotManager = dotManager

        this.radius = radius || random(DotManager.minRadius, DotManager.maxRadius)
        this.genitalWidth = genitalWidth || random(this.radius / DotManager.genitalDiv, this.radius)
        this.genitalHeight = 0
        this.endGenitalHeight = genitalHeight || random(this.radius / DotManager.genitalDiv, this.radius)

        const viewSize = paper.project.view.viewSize
        this.point = point || new paper.Point.random().multiply(viewSize)
        this.#scalePoint = new paper.Point(random(-viewSize.width, viewSize.width), random(-viewSize.height, viewSize.height))
        this.#distanceObj = distance || random(DotManager.minDistance, viewSize.width)

        this.#scaleSpeed = this.#distanceObj / this.#scalePoint.subtract(this.point).length
        this.#colorMan = new ColorManager(this, innerColor, outerColor)
    }

    #applyVisibility(item) {
        item.fillColor = this.innerColor
        item.shadowColor = this.outerColor
        item.strokeColor = this.outerColor
        item.strokeWidth = this.colorManager.strokeWidth

        item.shadowBlur = this.colorManager.shadowBlur
        item.shadowOffset = 0
    }

    #addToArr(arr, ...args) {
        args.forEach((arg) => {
            arr.push(arg)
        })

        this.#cleanUpAll()
    }

    //deletes everything but last element in array unless specified otherwise
    #scrubArr(arr, distance = 1) {
        for (let i = 0; i < arr.length - distance; i++) {
            arr[i].remove()
            arr.splice(i, 1)
        }
    }

    #cleanUpAll() {
        this.#scrubArr(this.appendageArr, 0)
        this.#scrubArr(this.circleArr)
        this.#scrubArr(this.shapeArr)
        this.#scrubArr(this.lineArr)
    }

    get distance(){
        return this.#distanceObj
    }

    set distance(dist){
        this.#distanceObj = dist
    }

    get vector() {
        return this.#vector
    }

    set vector(vector) {
        const len = constrain(vector.length, DotManager.minVector, DotManager.maxVector)
        this.#vector = new paper.Point({length: len, angle: vector.angle})

        this.drawVector()
    }

    get colorManager() {
        return this.#colorMan
    }

    get innerColor() {
        return this.colorManager.innerColor
    }

    set innerColor(color) {
        this.colorManager.innerColor = color
        this.#applyVisibility(this.shape)
    }

    get outerColor() {
        return this.colorManager.outerColor
    }

    set outerColor(color) {
        this.colorManager.outerColor = color
        this.#applyVisibility(this.shape)
    }

    get position() {
        return this.shape.position
    }

    set position(position) {
        this.shape.position = position
    }

    get shape() {
        return this.#currentShape
    }

    set shape(shape) {
        this.#currentShape = shape
        this.#currentShape.name = "currentShape"
        this.shapeArr.push(this.#currentShape)

        this.#addToArr(this.shapeArr, this.#currentShape)
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
            this.#generateFirstVector()
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
            this.#applyVisibility(circle)
        }

        this.#addToArr(this.circleArr, circle)
        return circle
    }

    collisionDetected(value = true) {
        this.isColliding = value
        this.#currentShape.fillColor = "pink"
    }

    genGenitalia(height) {
        const tolerance = this.genitalWidth / 2
        const xPos = this.point.x - this.genitalWidth / 2
        const yPosButt = this.point.y + this.radius + tolerance
        const yPosPenis = this.point.y - this.radius + tolerance

        this.penis = new Appendage(xPos, yPosPenis, this.radius, this.genitalWidth, height)
        this.butt = new Appendage(xPos, yPosButt, this.radius, this.genitalWidth, height)

        this.#addToArr(this.appendageArr, this.penis, this.butt)
    }

    growGenitalia() {
        if (this.genitalHeight < this.endGenitalHeight) {
            this.genGenitalia(this.genitalHeight)
            this.genitalHeight += this.#growSpeed
            this.isGrowing = true
        } else {
            this.isGrowing = false
            this.doneGrowing = true
        }

        const circle = this.genCircle(false)
        const buttCircle = circle.subtract(this.butt)
        const penisCircle = buttCircle.unite(this.penis)

        buttCircle.name = 'buttCircle'
        penisCircle.name = 'penisCircle'
        this.#applyVisibility(penisCircle)

        this.#addToArr(this.circleArr, circle, buttCircle, penisCircle)
        penisCircle.rotation = this.#rotation
        this.shape = penisCircle
    }

    //returns true if out of bounds
    outOfBounds() {
        const viewBounds = paper.project.view.bounds
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
        const scaleDiff = this.point.subtract(this.#scalePoint)

        // consoleLog("scaleDiff", scaleDiff)
        // consoleLog("scaleSpeed", this.#scaleSpeed)

        consoleLog("scaleDiv", scaleDiff.divide(this.#scaleSpeed))
        consoleLog("scaleSpeed", this.#scaleSpeed)

        const scaleX = map(this.#scalePoint.x / this.distance, 0, 1, 0, view.width)
        const scaleY = map(this.#scalePoint.y / this.distance, 0, 1, 0, view.height)
        let point = new paper.Point(scaleX, scaleY)
        const radius = map(this.distance, 0, view.width, this.radius, DotManager.minRadius)

        if (this.distance < DotManager.minDistance) {
            this.doneScaling = true
            // console.log("done scaling")
            // console.log(`scaleX: ${scaleX}`)
            // console.log(`scaleY: ${scaleY}`)
        } else {
            this.distance -= this.#scaleSpeed


            this.#scalePoint = this.#scalePoint.add(scaleDiff.divide(this.#scaleSpeed))

            this.shape = this.genCircle(true, point, radius)
            // this.shape.translate(half)
        }
    }

    drawVector() {
        const end = this.position.add(this.vector)
        const line = new paper.Path.Line(this.position, end)
        line.strokeColor = "red"
    }

    //runs only once to generate the first vector
    #generateFirstVector() {
        if (this.vector == null) {
            const minSize = DotManager.minRadius * ((DotManager.minRadius / 5) ** 2)
            const maxSize = DotManager.maxRadius ** 3

            const size = this.genitalWidth * this.endGenitalHeight * this.radius
            this.size = map(size, minSize, maxSize, DotManager.minRadius, DotManager.maxRadius)

            const length = random(DotManager.minVector, DotManager.maxVector)
            this.vector = new paper.Point({length: length, angle: this.#rotation - 90})

            consoleLog("size", this.size)
            consoleLog("vector", this.vector.length)
            consoleLog("div", this.size / this.vector.length)
        }
    }

    attractShape(shape) {
        let force = this.position.subtract(shape.position)
        const distance = constrain(force.length, DotManager.minVector, DotManager.maxVector)
        const strength = (G * this.size * shape.size) / distance ** 2

        shape.applyForce(force.normalize(strength))
    }

    applyForce(force) {
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

    react(other) {
        var overlap = this.radius + b.radius - dist;
        var direc = (this.point - b.point).normalize(overlap * 0.015);
        this.vector += direc;
        b.vector -= direc;
    }
}