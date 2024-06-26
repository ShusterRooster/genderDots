import Relationship from "./Relationship";
import AdultShape from "../AdultShape";
import {
    genitalDiv,
    maxOrbitRotateSpeed,
    maxOrbitSpeed,
    maxRadius,
    maxSize,
    maxTimeOOB,
    maxTrailLength,
    maxTrailSegments,
    maxTrailVector,
    minOrbitRotateSpeed,
    minOrbitSpeed,
    minRadius,
    minSize,
    minTrailLength,
    minTrailSegments,
    minTrailVector,
    orbitOffset,
    orbitPathFadeSpeed,
    orbitPathOpacity,
    orbitSeekDelay,
    trailFadeDelay,
    trailFadeSpeed,
    trailOpacity,
} from "../../Settings";
import {delay, map, outOfBounds, randomFromArr} from "../HelperFunctions";
import paper from "paper";
import PathArray from "../PathArray";
import ShapeManager from "../ShapeManager";

interface ShapeOrbit {
    name: string
    shape: AdultShape,
    point: paper.Point,
    speed: number,
    trail: paper.Path,
    segments: number,
    length: number
}

export default class OrbitRelationship extends Relationship {
    static minOrbitOffset = Math.sqrt((
        (minRadius * 2) ** 2) + ((minRadius * 2) + (minRadius / genitalDiv)) ** 2)

    static maxOrbitOffset = Math.sqrt((
        (maxRadius * 2) ** 2) + ((maxRadius * 2) + maxRadius) ** 2)

    orbitDist: number
    shapeOrbits = new Set<ShapeOrbit>()
    // @ts-ignore
    _leader: AdultShape
    path: paper.Path
    rotateSpeed: number
    oldTrails = new PathArray("orbitTrail")

    lastTimeInBounds = performance.now()

    constructor(partners: AdultShape[], shapeManager: ShapeManager) {
        super(partners, shapeManager);

        this.findLeader()
        this.orbitDist = this.calcOrbitDist()
        this.rotateSpeed = this.calcRotateSpeed()
        this.path = this.makeOrbitPath()

        this.applyStartRelationshipAll()
        this.fadeInOrbitPath()
    }

    fadeInOrbitPath() {
        return new Promise(async (resolve) => {
            if (this.path.opacity >= orbitPathOpacity) {
                resolve(true);
            } else {
                this.path.opacity += orbitPathFadeSpeed
                await delay(orbitSeekDelay)
                this.fadeInOrbitPath().then(resolve)
            }
        });
    }

    fadeOutOrbitPath() {
        return new Promise(async (resolve) => {
            if (this.path.opacity <= 0) {
                await delay(orbitSeekDelay)
                resolve(true);
            } else {
                this.path.opacity -= orbitPathFadeSpeed
                await delay(orbitSeekDelay)
                this.fadeOutOrbitPath().then(resolve)
            }
        });
    }

    resetOrbitPath() {
        this.eventLog?.create(`Orbit path reset`)

        this.fadeOutOrbitPath().then(() => {
            this.orbitDist = this.calcOrbitDist()
            this.rotateSpeed = this.calcRotateSpeed()

            for (const orbit of this.shapeOrbits) {
                orbit.point.length = this.orbitDist
            }

            this.path.remove()
            this.path = this.makeOrbitPath()
            this.fadeInOrbitPath()
        })
    }

    insideOrbitPath(shape: AdultShape) {
        return new Promise(async (resolve, reject) => {
            if(shape?.relationship !== this) {
                this.eventLog?.create("Shape inside orbit Not Valid, Shape no longer in relationship", shape)
                shape.generateVector()
                reject("OrbitRelationship no longer valid")
                return
            }
            else if(this.leader == shape) {
                this.eventLog?.create(`${shape.name} going inside orbit is leader, process stopped`, shape)
                shape.generateVector()
                reject("Leader stopped from going into orbit")
                return
            }

            if (this.path !== undefined && shape !== undefined) {
                if (this.path.contains(shape.position)) {
                    await delay(orbitSeekDelay)
                    resolve(true);
                } else {
                    shape.seek(this.leader)
                    await delay(orbitSeekDelay)
                    this.insideOrbitPath(shape).then(resolve, reject)
                }
            }
            else {
                await delay(orbitSeekDelay)
                this.insideOrbitPath(shape).then(resolve, reject)
            }
        });
    }

    makeTrail(shape: AdultShape) {
        return new paper.Path({
            name: "orbitTrail",
            strokeCap: 'round',
            strokeWidth: shape.strokeWidth * 0.5,
            strokeColor: shape.color,
            opacity: trailOpacity
        })
    }

    makeOrbitPath() {
        return  new paper.Path.Circle({
            name: "orbitPath",
            point: this.leader.position,
            radius: this.calcOrbitDist(),
            strokeColor: this.leader.color,
            strokeWidth: 5,
            dashArray: [20, 20],
            opacity: 0
        })
    }

    async applyRelationshipStart(shape: AdultShape) {
        super.applyRelationshipStart(shape)

        if (shape == this.leader) {
            shape.teleport = false
            this.eventLog?.create(`Relationship apply start failed, ${shape.name} is leader`, shape)
            return
        }

        this.insideOrbitPath(shape).then(() => {
            this.eventLog?.create(`${shape.name} inside orbitPath!`, shape)
            shape.teleport = false
            const outerPt = this.path.getNearestPoint(shape.position)
            const diff = outerPt.subtract(this.path.position)

            const inter: ShapeOrbit = {
                name: shape.name,
                shape: shape,
                point: new paper.Point({
                    angle: diff.angle,
                    length: this.orbitDist
                }),

                speed: this.calcOrbitSpeed(shape),
                trail: this.makeTrail(shape),
                segments: this.calcTrailSegments(shape),
                length: this.calcTrailLength(shape)
            }

            this.eventLog?.create(`Orbit for ${inter.name} added to orbits!`, inter)
            this.shapeOrbits.add(inter)
        })
    }

    calcBoundDist(shape: AdultShape) {
        const bounds = shape.shape.bounds
        return bounds.topLeft.subtract(bounds.bottomRight).length
    }

    calcOrbitDist() {
        let dist = 0

        for (const partner of this.partners) {
            const calc = this.calcBoundDist(partner)

            if (calc > dist)
                dist = calc
        }

        return dist + orbitOffset
    }

    calcOrbitSpeed(shape: AdultShape) {
        return map(shape.size, minSize, maxSize, minOrbitSpeed, maxOrbitSpeed)
    }

    calcTrailSegments(shape: AdultShape) {
        return map(shape.size, minRadius, maxRadius, minTrailSegments, maxTrailSegments)
    }

    calcTrailLength(shape: AdultShape) {
        const segments = this.calcTrailSegments(shape)
        return map(segments, minTrailSegments, maxTrailSegments, minTrailLength, maxTrailLength)
    }

    calcRotateSpeed() {
        return map(this.calcOrbitDist(), OrbitRelationship.minOrbitOffset, OrbitRelationship.maxOrbitOffset, maxOrbitRotateSpeed, minOrbitRotateSpeed)
    }

    get leader() {
        return this._leader
    }

    set leader(leader) {
        this.removeOrbit(leader)
        this._leader = leader

        this.eventLog?.create(`New leader set!: ${leader.name}`, leader)
    }

    findLeader(avoid?: AdultShape) {
        if(avoid)
            this.eventLog?.create(`Finding new leader, avoid: ${avoid?.name}`, avoid)
        else
            this.eventLog?.create(`Finding leader, no avoid`)



        let rand: AdultShape;

        do {
            rand = randomFromArr(Array.from(this.partners));
        } while (rand === avoid);

        this.leader = rand
    }

    removeLeader(leader: AdultShape) {
        this.eventLog?.create(`Leader removed, ${leader.name}`, leader)

        this.removeOrbit(leader)
        this.findLeader(leader)

        this.fadeOutOrbitPath().then(() => {
            this.applyRelationshipEnd(leader)
            this.resetOrbitPath()
        })
    }

    readyToTeleport() {
        if(!outOfBounds(this.path))
            return false

        if(!this.leader.outOfBounds())
            return false

        for (const orbit of this.shapeOrbits) {
            if (!orbit.shape.outOfBounds()) {
                return false
            }
        }

        return true
    }

    checkOOB() {
        if(performance.now() - this.lastTimeInBounds >= maxTimeOOB) {
            this.eventLog?.create(`Stuck out of bounds`)

            for (const shape of this.partners) {
                shape.shape.opacity = 0
            }
            this.path.opacity = 0

            const position = this.leader.position = paper.Point.random().multiply(paper.view.viewSize);
            this.eventLog?.create(`Placed at position: ${position}`)

            for (const shape of this.partners) {
                shape.fadeInOOB()
            }
            this.fadeInOrbitPath()
        }
        else {
            this.leader.teleportOpposite()
        }
    }

    run() {
        this.path.position = this.leader.position
        this.path.rotation += this.rotateSpeed

        if(this.readyToTeleport()) {
            this.checkOOB()
        }
        else {
            this.lastTimeInBounds = performance.now()
        }

        for (const orbit of this.shapeOrbits) {
            orbit.point.angle += orbit.speed
            const pos = orbit.point.add(this.leader.position)
            const prev = orbit.shape.position
            orbit.shape.position = pos

            this.handleTrail(orbit, prev, pos)
        }
    }

    handleTrail(orbit: ShapeOrbit, prev: paper.Point, cur: paper.Point) {
        const vector = cur.subtract(prev)

        if (vector.length <= maxTrailVector && vector.length > minTrailVector) {
            orbit.trail.add(cur)
        }
        else {
            this.fadeTrail(orbit.trail)
            this.oldTrails.push(orbit.trail)
            orbit.trail = this.makeTrail(orbit.shape)
        }

        if (orbit.trail.segments.length >= minTrailSegments) {
            for (let i = 1; i < orbit.trail.segments.length; i++) {
                const segment = orbit.trail.segments[i]
                const next = segment.previous
                const vector = segment.point.subtract(next.point)
                vector.length = orbit.length
                next.point = segment.point.subtract(vector)

                orbit.trail.smooth({type: 'continuous'})
            }
        }

        if (orbit.trail.segments.length > orbit.segments) {
            orbit.trail.removeSegment(0)
        }
    }

    fadeTrail(trail: paper.Path) {
        if (outOfBounds(trail)) {
            trail.remove()
            return
        }

        if (trail.opacity > trailFadeSpeed) {
            trail.opacity -= trailFadeSpeed
            setTimeout(() => this.fadeTrail(trail), trailFadeDelay)
        } else {
            trail.remove()
        }
    }

    removeOrbit(shape: AdultShape): boolean {
        this.eventLog?.create(`Removing orbit of ${shape.name}`, [shape, this.shapeOrbits]);

        for (const orb of this.shapeOrbits) {
            this.eventLog?.create(`removeOrbit: Checking orbit ${orb.name}`, orb);

            //not working with object equality???
            if (orb.name === shape.name) {
                this.eventLog?.create(`removeOrbit: Found matching shape! Removing orbit...`, orb);

                // Ensure the trail is cloned and removed correctly
                this.fadeTrail(orb.trail.clone());
                orb.trail.remove();

                // Remove the orbit from the array
                this.shapeOrbits.delete(orb)
                this.eventLog?.create(`Orbit removed. Updated shapeOrbits:`, this.shapeOrbits);
                return true;
            }
        }

        this.eventLog?.create('removeOrbit fail: No matching shape found.');
        return false;
    }


    removeAllOrbits() {
        this.eventLog?.create(`Removing all orbits!`, this.shapeOrbits);

        for (const orbit of this.shapeOrbits) {
            this.eventLog?.create(`removeAllOrbits: deleting orbit ${orbit.name}`, orbit);
            this.fadeTrail(orbit.trail.clone())
            orbit.trail.remove()
            this.shapeOrbits.delete(orbit)
        }

        this.eventLog?.create("All orbits removed!", this.shapeOrbits)
    }

    info() {
        const base = super.info()
        let orbitStr = ""

        for (const orbit of this.shapeOrbits) {
            orbitStr += `${orbit.shape.name}<br>`
        }

        return `${base}<br>leader: ${this.leader.name}<br>orbits: ${orbitStr}`
    }

    applyRelationshipEnd(shape: AdultShape) {
        super.applyRelationshipEnd(shape)
        this.removeOrbit(shape)
        shape.teleport = true
        shape.generateVector()
    }

    addPartnerAction(partner: AdultShape) {
        if(this.calcOrbitDist() != this.orbitDist) {
            this.resetOrbitPath()
        }
    }

    removePartnerAction(shape: AdultShape) {
        if (shape == this.leader) {
            this.removeLeader(shape)
            return
        }

        this.removeOrbit(shape)
        if(this.calcOrbitDist() != this.orbitDist) {
            this.resetOrbitPath()
        }
    }

    endRelationship() {
        this.fadeOutOrbitPath().then(() => {
            this.path.remove()
            this.removeAllOrbits()
        })

        super.endRelationship();
    }
}