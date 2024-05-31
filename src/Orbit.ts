import {Relationship} from "./Relationship";
import AdultShape from "./AdultShape";
import {maxOrbitSpeed, maxSize, minOrbitSpeed, minSize, orbitOffset} from "../Settings";
import {map, random, randomFromArr} from "./HelperFunctions";
import paper from "paper";

interface ShapeOrbit {
    shape: AdultShape,
    point: paper.Point,
    speed: number
}

export default class Orbit {
    relationship: Relationship
    orbitDist: number
    shapes: ShapeOrbit[] = []
    leader: AdultShape
    path: paper.Path
    active = true

    constructor(relationship: Relationship) {
        this.relationship = relationship
        this.orbitDist = this.calcOrbitDist()
        this.leader = this.findLeader()

        this.path = new paper.Path.Circle(this.leader.position, this.orbitDist)

        // @ts-ignore
        this.path.strokeColor = "white"
        this.path.strokeWidth = 5

        this.applyOrbitAll()
    }

    applyOrbit(shape: AdultShape) {
        if(shape == this.leader)
            return

        shape.moving = false
        const inter: ShapeOrbit = {
            shape: shape,

            point: new paper.Point({
                angle: random(0, 360),
                length: this.orbitDist
            }),

            speed: this.calcOrbitSpeed(shape)
        }

        this.shapes.push(inter)
    }

    applyOrbitAll() {
        for (const shape of this.relationship.partners) {
            this.applyOrbit(shape)
        }
    }

    calcBoundDist(shape: AdultShape) {
        const bounds = shape.symbol.bounds
        return bounds.topLeft.subtract(bounds.bottomRight).length
    }

    calcOrbitDist() {
        let dist = 0

        for (const partner of this.relationship.partners) {
            const calc = this.calcBoundDist(partner)

            if (calc > dist)
                dist = calc
        }

        return dist + orbitOffset
    }

    calcOrbitSpeed(shape: AdultShape) {
        return map(shape.size, minSize, maxSize, minOrbitSpeed, maxOrbitSpeed)
    }

    findLeader(): AdultShape {
        return randomFromArr(Array.from(this.relationship.partners))
    }

    orbit() {
        if(this.active) {
            this.path.position = this.leader.position

            for (const orbit of this.shapes) {
                orbit.shape.position = orbit.point.add(this.leader.position)
                orbit.point.angle += orbit.speed
            }
        }
    }

    addPartner(shape: AdultShape) {
        this.applyOrbit(shape)
    }

    removePartner(shape: AdultShape) {
        if(this.relationship.partners.size == 1)
            this.removeAll()


        if (shape == this.leader)
            this.leader = this.findLeader()

        for (let i = 0; i < this.shapes.length; i++) {
            const orb = this.shapes[i]

            if (orb.shape == shape) {
                this.shapes.splice(i, 1)
                return
            }
        }
    }

    removeAll() {
        this.path.remove()
        this.active = false

        for (const shape of this.relationship.partners) {
            shape.moving = true
        }

        this.leader.moving = true
        this.relationship.endRelationship()
        console.log(this.leader)
    }
}