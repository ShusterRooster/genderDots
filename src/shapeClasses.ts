import DotManager from "./DotManager";
import ColorManager from "./ColorManager";
import {
    between,
    constrain,
    map,
    PathArray,
    Probability,
    random,
    randomFromArr,
    setValueIfNull
} from "./HelperFunctions";
import paper, {view} from "paper";
import {Relationship} from "./Relationship";

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

interface Genital {
    name: string
    path: paper.Path.Line
}

export interface genderShape {
    dotManager?: DotManager,
    spawnPoint?: paper.Point,
    radius?: number,
    distance?: number,
    sex?: string,
    genitalWidth?: number,
    genitalEndHeight?: number,
    color?: paper.Color
}

export default class GenderShape {
    spawnPoint: paper.Point
    dotManager: DotManager | undefined
    colorManager: ColorManager
    sex: string

    distance: number
    protected _vector: paper.Point | undefined
    protected _shape: any

    protected scaleSpeed: number
    protected growSpeed: number
    protected rotation = random(0, 360)

    doneGrowing = false
    doneScaling = false
    ready = false

    acceleration = new paper.Point(0, 0)
    velocity = new paper.Point(0, 0)

    collisionEnabled = false
    isColliding = false

    circleArr = new PathArray("circleArr")
    shapeArr = new PathArray("shapeArr")
    lineArr = new PathArray("lineArr")
    appendageArr = new PathArray("appendageArr", 0)

    isLoner: boolean
    relationship: Relationship | undefined
    tolerance = random(0, 0.25)
    changeRate = random(0.5, 1.25)
    attractionType = randomFromArr(Relationship.attractionTypes)

    radius: number
    genitalWidth: number
    genitalHeight = 0
    genitalEndHeight: number

    constructor(shape: genderShape) {
        this.dotManager = shape.dotManager
        this.spawnPoint = setValueIfNull(shape.spawnPoint, paper.Point.random().multiply(paper.view.viewSize))
        this.radius = setValueIfNull(shape.radius, random(DotManager.minRadius, DotManager.maxRadius))
        this.distance = setValueIfNull(shape.distance, random(DotManager.minDistance, DotManager.maxDistance))
        this.sex = setValueIfNull(shape.sex, GenderShape.determineSex())
        this.genitalWidth = setValueIfNull(shape.genitalWidth, random(this.radius / DotManager.genitalDiv, this.radius))
        this.genitalEndHeight = setValueIfNull(shape.genitalEndHeight, random(this.radius / DotManager.genitalDiv, this.radius))

        this.scaleSpeed = DotManager.baseScaleSpeed * (1 - (this.distance / DotManager.maxDistance))
        this.growSpeed = (this.genitalWidth * this.genitalEndHeight) / ((DotManager.maxRadius / DotManager.genitalDiv) ** 2)

        this.isLoner = Math.random() * 100 <= DotManager.lonerChance

        this.colorManager = new ColorManager(this, shape.color)
    }

    //runs only once to generate the first vector
    protected generateFirstVector() {
        const length = random(DotManager.minVector, DotManager.maxVector)
        this.vector = new paper.Point({length: length, angle: this.rotation - 90})
    }

    protected static determineSex() {
        const sexes = DotManager.sexes
        const random = Math.random() * 100

        // Loop through sexes and accumulate probability
        let accumulatedProbability = 0;

        for (const sex of sexes) {
            accumulatedProbability += sex.probability;
            if (random <= accumulatedProbability) {
                return sex.name; // Return the name of the sex
            }
        }

        // If no match is found (shouldn't happen), return the last sex
        return sexes[sexes.length - 1].name
    }

    attractedTo(other: GenderShape) {
        const colorDiff = Math.abs(other.color.gray - this.color.gray)

        switch (this.attractionType) {
            case "similar": {
                return colorDiff <= this.tolerance
            }

            case "diff": {
                return colorDiff >= 1 - this.tolerance
            }

            case "random": {
                const rand = Math.random()

                return rand <= this.tolerance
            }
        }

        //if other conditions are not satisfied, default
        return false
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

    get vector(): paper.Point | undefined {
        return this._vector
    }

    set vector(vector: paper.Point) {
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
        this.ready = this.doneScaling && this.doneGrowing

        if(this.relationship)
            this.relationship.run()

        if (!this.doneScaling) {
            this.moveTowardScreen()
        } else {
            this.growGenitalia()
            this.collisionEnabled = true
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

    genPart(height: number, yPos: number, name: string): Genital {
        const xPos = this.spawnPoint.x - this.genitalWidth / 2

        const part = Appendage(xPos, yPos, this.genitalWidth, height)
        this.appendageArr.push(part)

        return {name: name, path: part}
    }

    genGenitalia(height: number, sex = this.sex, apply = true) {
        let value: Genital[]

        switch (sex) {
            case "male": {
                const yPosPenis = this.spawnPoint.y - this.radius + (this.genitalWidth / 2)
                value = [this.genPart(height, yPosPenis, "penis")]
                break
            }

            case "female": {
                const yPosButt = this.spawnPoint.y + this.radius + (this.genitalWidth / 2)
                value = [this.genPart(height, yPosButt, "butt")]
                break
            }

            case "intersex": {
                const yPosPenis = this.spawnPoint.y - this.radius + (this.genitalWidth / 2)
                const yPosButt = this.spawnPoint.y + this.radius + (this.genitalWidth / 2)
                value = [this.genPart(height, yPosPenis, "penis"), this.genPart(height, yPosButt, "butt")]
                break
            }
        }

        if (apply) this.applyGenitalia(value!)
    }

    growGenitalia() {
        if (this.genitalHeight < this.genitalEndHeight) {
            this.genGenitalia(this.genitalHeight)
            this.genitalHeight += this.growSpeed
        } else {
            this.doneGrowing = true
        }
    }

    applyGenitalia(genitals: Genital[]) {
        if (genitals.length > 1) {
            const penis = genitals[0]
            const butt = genitals[1]

            const circle = this.genCircle(false)
            const buttCircle = circle.subtract(butt.path)
            const penisCircle = buttCircle.unite(penis.path)

            buttCircle.name = 'buttCircle'
            penisCircle.name = 'penisCircle'
            this.colorManager.applyVisibility(penisCircle)

            this.circleArr.push(circle, buttCircle, penisCircle)
            this.shape = penisCircle
            this.shape.applyMatrix = false
            this.shape.rotation = this.rotation


        } else {
            let genitalCircle: paper.PathItem
            const circle = this.genCircle(false)
            const genital = genitals[0]

            switch (genital.name) {
                case "penis": {
                    genitalCircle = circle.unite(genital.path)
                    genitalCircle.name = 'penisCircle'
                    break
                }

                case "butt": {
                    genitalCircle = circle.subtract(genital.path)
                    genitalCircle.name = 'buttCircle'
                    break
                }
            }

            this.colorManager.applyVisibility(genitalCircle!)
            this.circleArr.push(circle, genitalCircle!)
            // genitalCircle!.rotation = this.rotation
            this.shape = genitalCircle!
            this.shape.applyMatrix = false
            this.shape.rotation = this.rotation
        }
    }

    //returns true if out of bounds
    outOfBounds() {
        const bounds = paper.view.bounds

        return !bounds.contains(this.position) && !this.shape.bounds.intersects(bounds)
    }

    checkBorders() {
        if (this.outOfBounds()) {
            const center = paper.view.center
            const dist = this.position.subtract(center).multiply(-1)
            this.position = center.add(dist)
        }
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
        if (this.ready) {
            const G = 6.67428 * (10 ** -11)
            let force = this.position.subtract(shape.position)
            const distance = constrain(force.length, DotManager.minVector, DotManager.maxVector)
            const strength = (G * this.size * shape.size) / distance ** 2

            shape.vector = force.normalize(strength)
        }
    }

    applyForce(force: paper.Point | undefined, heading = false) {
        const calc = force!.divide(this.size)

        if (calc.length > DotManager.maxVector)
            calc.normalize(DotManager.maxVector)


        this.acceleration = this.acceleration.add(force!.divide(this.size))

        if (heading)
            this.pointTowards(force!.angle)
    }

    collisionDetected() {
        this.isColliding = true
        this.shape.fillColor = "pink"
    }

    pointTowards(angle: number) {
        angle += 90

        const mod = ((angle - this.shape.rotation) / 180) * DotManager.maxForce
        this.shape.rotation += mod
    }

    seek(target: GenderShape | paper.Point) {
        if (this.ready) {
            let desired: paper.Point

            desired = target instanceof GenderShape ? target.shape.position.subtract(this.position) : target.subtract(this.position)

            const d = desired.length

            if (d < this.radius * 2) {
                const m = map(d, 0, this.radius * 2, 0, DotManager.maxVector)
                desired.normalize(m);

            } else {
                desired.normalize(DotManager.maxVector);
            }

            let steer = desired.subtract(this.velocity)
            this.applyForce(steer)

            this.pointTowards(desired.angle)
        }

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


        this.checkBorders()
        // if (this.outOfBounds()) {
        //     this.dotManager?.remove(this)
        // }
    }

    // react(other) {
    //     var overlap = this.radius + b.radius - dist;
    //     var direc = (this.point - b.point).normalize(overlap * 0.015);
    //     this.vector += direc;
    //     b.vector -= direc;
    // }
}