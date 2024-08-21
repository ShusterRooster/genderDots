import Relationship from "./Relationship";
import AdultShape from "../AdultShape";
import {
    debugMode,
    genitalDiv,
    maxOrbitRotateSpeed,
    maxOrbitSpeed,
    maxRadius,
    maxSize,
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
    oobTolerance,
    orbitFadeDuration,
    orbitOffset,
    orbitSeekDelay,
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

    // @ts-ignore
    protected _leader: AdultShape

    // @ts-ignore
    protected _orbitDist: number
    rotateSpeed: number

    path: paper.Path
    shapeOrbits = new Set<ShapeOrbit>()
    oldTrails = new PathArray("orbitTrail")

    boundsRect?: paper.Path
    timeTillOOB: number
    lastTimeInBounds = performance.now()
    fadeTween?: paper.Tween

    constructor(partners: AdultShape[], shapeManager: ShapeManager) {
        super(partners, shapeManager);

        this.findLeader()
        this.orbitDist = this.calcOrbitDist()
        this.rotateSpeed = this.calcRotateSpeed()
        this.path = this.makeOrbitPath()
        this.timeTillOOB = this.calcTimeOOB() + oobTolerance

        this.applyStartRelationshipAll()
        this.fadeOrbitPath(1)

        if(debugMode) {
            this.boundsRect = new paper.Path.Rectangle(this.calcBounds())
        }

    }

    run() {
        this.path.position = this.leader.position
        this.path.rotation += this.rotateSpeed

        if(this.boundsRect)
            this.boundsRect.position = this.leader.position

        if(this.outOfBounds()) {
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

    insideOrbitPath(shape: AdultShape) {
        return new Promise(async (resolve, reject) => {
            if(shape?.relationship !== this) {
                this.eventLog?.create(`${shape.name} inside orbit Not Valid, no longer in relationship`, shape)
                shape.generateVector()
                reject(`OrbitRelationship no longer valid for ${shape.name}`)
                return
            }
            else if(this.leader == shape) {
                this.eventLog?.create(`${shape.name} going inside orbit is leader, process stopped`, shape)
                shape.generateVector()
                reject(`Leader ${shape.name} stopped from going into orbit`)
                return
            }

            if (this.path !== undefined && shape !== undefined) {
                if (this.path.contains(shape.position)) {
                    await delay(orbitSeekDelay)
                    resolve(true);
                } else {
                    shape.arrive(this.leader.pivot)
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

            if(this.calcOrbitDist() != this.orbitDist) {
                this.resetOrbitPath()
            }
        })
    }


    findLeader(avoid?: AdultShape) {
        if(avoid)
            this.eventLog?.create(`Finding new leader, avoid: ${avoid?.name}`, avoid)
        else
            this.eventLog?.create(`Finding leader, no avoid`)


        if(this.partners.size == 1) {
            console.log("partner size is 1 and avoid is probably that")
            return
        }

        let rand: AdultShape;

        do {
            rand = randomFromArr(Array.from(this.partners));
        } while (rand === avoid);

        this.leader = rand

        if(avoid) {
            this.eventLog?.create(`Since avoid, leader's orbit will be removed.`, rand)
            this.removeOrbit(rand)
        }
    }

    removeLeader(leader: AdultShape) {
        this.eventLog?.create(`Leader removed, ${leader.name}`, leader)

        this.removeOrbit(leader)
        this.findLeader(leader)

        this.fadeOrbitPath(0).then(() => {
            this.applyRelationshipEnd(leader)
            this.resetOrbitPath()
        })
    }

    outOfBounds() {
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
        if(performance.now() - this.lastTimeInBounds >= this.timeTillOOB) {
            this.eventLog?.create(`Stuck out of bounds`)
            this.eventLog?.create(`timeTillOOB: ${this.timeTillOOB}`)

            for (const shape of this.partners) {
                shape.shape.opacity = 0
            }
            this.path.opacity = 0

            const position = this.leader.position = paper.Point.random().multiply(paper.view.viewSize);
            this.eventLog?.create(`Placed at position: ${position}`)

            for (const shape of this.partners) {
                shape.fadeInOOB()
            }
            this.fadeOrbitPath(1)
        }
        else {
            this.leader.teleportOpposite()
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

        trail.tweenTo({opacity: 0}, orbitFadeDuration).then(() => {
            trail.remove()
        })
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

    resetOrbitPath() {
        this.eventLog?.create(`Orbit path reset`)

        this.fadeOrbitPath(0).then(() => {
            this.eventLog?.create(`Orbit path faded out!`, this.path)

            this.orbitDist = this.calcOrbitDist()
            this.rotateSpeed = this.calcRotateSpeed()
            this.timeTillOOB = this.calcTimeOOB()

            this.path.remove()
            this.path = this.makeOrbitPath()
            this.fadeOrbitPath(1)
        })
    }

    applyRelationshipEnd(shape: AdultShape) {
        super.applyRelationshipEnd(shape)

        if (shape == this.leader)
            this.removeLeader(shape)
        else
            this.removeOrbit(shape)

        shape.teleport = true
        shape.generateVector()

        if(this.calcOrbitDist() != this.orbitDist)
            this.resetOrbitPath()
    }

    endRelationship() {
        this.fadeOrbitPath(0).then(() => {
            this.path.remove()
            this.removeAllOrbits()
        })

        super.endRelationship();
    }

    fadeOrbitPath(opacity: number) {
        this.eventLog?.create(`Orbit path fading to opacity: ${opacity}`, this.path);
        return this.fadeTween = this.path.tweenTo({opacity: opacity}, orbitFadeDuration)
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

    info() {
        const base = super.info()
        let orbitStr = ""

        for (const orbit of this.shapeOrbits) {
            orbitStr += `${orbit.shape.name}<br>`
        }

        return `${base}<br>leader: ${this.leader.name}<br>orbits: ${orbitStr}`
    }

    get leader() {
        return this._leader
    }

    set leader(leader) {
        this._leader = leader

        this.eventLog?.create(`New leader set!: ${leader.name}`, leader)
    }

    get orbitDist() {
        return this._orbitDist
    }

    set orbitDist(orbitDist: number) {
        for (const orbit of this.shapeOrbits) {
            orbit.point.length = orbitDist
        }

        this._orbitDist = orbitDist
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

    calcTimeOOB() {
        const dist = this.calcBounds().height
        return this.leader.timeTillOOB(true, dist)
    }

    calcBounds() {
        const dist = this.orbitDist * 3
        return new paper.Size(dist, dist)
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
}