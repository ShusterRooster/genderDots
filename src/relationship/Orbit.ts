import {Relationship} from "./Relationship";
import AdultShape from "../AdultShape";
import {
    maxOrbitSpeed,
    maxSize,
    minOrbitSpeed,
    minSize,
    orbitOffset,
    trailFadeDelay,
    trailFadeSpeed,
    trailSegments
} from "../../Settings";
import {map, outOfBounds, random, randomFromArr} from "../HelperFunctions";
import paper from "paper";

interface ShapeOrbit {
    shape: AdultShape,
    point: paper.Point,
    speed: number,
    trail: paper.Path
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

        this.path = new paper.Path.Circle({
            point: this.leader.position,
            radius: this.orbitDist,
            strokeColor: "white",
            strokeWidth: 5,
            dashArray: [20, 20]
        })
        this.path.strokeColor!.alpha = 0.32

        this.applyOrbitAll()
    }

    makeTrail(shape: AdultShape) {
        return new paper.Path({
            strokeCap: 'round',
            strokeWidth: shape.strokeWidth,
            strokeColor: shape.color
        })
    }

    applyOrbit(shape: AdultShape) {
        if (shape == this.leader)
            return

        shape.moving = false
        const inter: ShapeOrbit = {
            shape: shape,

            point: new paper.Point({
                angle: random(0, 360),
                length: this.orbitDist
            }),

            speed: this.calcOrbitSpeed(shape),

            trail: this.makeTrail(shape)
        }

        inter.trail.strokeColor!.alpha = 0.5
        this.shapes.push(inter)
    }

    applyOrbitAll() {
        for (const shape of this.relationship.partners) {
            this.applyOrbit(shape)
        }
    }

    calcBoundDist(shape: AdultShape) {
        const bounds = shape.shape.bounds
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

    findLeader(avoid?: AdultShape) {
        let rand: AdultShape;

        do {
            rand = randomFromArr(Array.from(this.relationship.partners));
        } while (rand === avoid);

        return rand;
    }

    orbit() {
        this.path.position = this.leader.position

        if(outOfBounds(this.path)) {
            if(this.relationship.readyToTeleport())
                this.relationship.teleportAll()
        }

        for (const orbit of this.shapes) {
            orbit.point.angle += orbit.speed
            const pos = orbit.point.add(this.leader.position)
            const prev = orbit.shape.position
            orbit.shape.position = pos

            this.handleTrail(orbit, prev, pos)
        }
    }

    handleTrail(orbit: ShapeOrbit, prev: paper.Point, cur: paper.Point) {
        const vector = cur.subtract(prev)

        if(vector.length <= 20)
            orbit.trail.add(cur)
        else {
            this.fadeTrail(orbit.trail)
            orbit.trail = this.makeTrail(orbit.shape)
        }

        if(orbit.trail.segments.length >= 10) {
            for (let i = 1; i < orbit.trail.segments.length; i++) {
                const segment = orbit.trail.segments[i]
                const next = segment.previous
                const vector = segment.point.subtract(next.point)
                vector.length = 25
                next.point = segment.point.subtract(vector)

                orbit.trail.smooth({type: 'continuous'})
            }
        }

        if(orbit.trail.segments.length > trailSegments) {
            orbit.trail.removeSegment(0)
        }
    }

    fadeTrail(trail: paper.Path) {
        if(trail.strokeColor!.alpha > 0) {
            trail.strokeColor!.alpha -= trailFadeSpeed
            setTimeout(() => this.fadeTrail(trail), trailFadeDelay)
        }
    }

    addPartner(shape: AdultShape) {
        this.applyOrbit(shape)
    }

    removePartner(shape: AdultShape) {
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