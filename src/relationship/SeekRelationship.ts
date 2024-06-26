import AdultShape from "../AdultShape";
import ShapeManager from "../ShapeManager";
import {delay, randomFromArr} from "../HelperFunctions";
import Relationship from "./Relationship";
import {recursiveDelay} from "../../Settings";

export default class SeekRelationship extends Relationship {

    leader: AdultShape
    inside = new Set<AdultShape>()

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager) {

        super(partners, dotManager)
        this.leader = this.findLeader()
        this.applyStartRelationshipAll()
    }

    readyToTeleport(): boolean {
        if (!this.leader.outOfBounds())
            return false

        for (const shape of this.inside) {
            if (!shape.outOfBounds()) {
                return false
            }
        }

        return true
    }

    teleportAll() {
        this.leader.teleportOpposite()

        for (const shape of this.inside) {
            shape.teleportOpposite()
        }
    }

    info() {
        const base = super.info()
        let insideStr = ""

        for (const partner of this.inside) {
            insideStr += `${partner.name}<br>`
        }

        return `${base}<br>leader: ${this.leader.name}<br>inside: ${insideStr}`
    }

    run() {
        if (this.readyToTeleport()) {
            this.teleportAll()
        }

        for (const shape of this.partners) {
            if (shape !== this.leader) {
                shape.seek(this.leader);
            }
        }
    }

    insideRel(shape: AdultShape) {
        return new Promise(async (resolve, reject) => {
            if (shape?.relationship !== this) {
                this.eventLog?.create(`Shape seeking no longer valid, shape ${shape.name} no longer in relationship`, shape)
                shape.generateVector()
                reject("SeekRelationship: shape no longer in relationship")
                return
            } else if (this.leader == shape) {
                this.eventLog?.create(`${shape.name} seeking inside relationship is leader, process stopped`, shape)
                shape.generateVector()
                reject("Leader stopped from going into seek relationship")
                return
            }

            if (this.leader !== undefined && shape !== undefined) {
                if (this.leader.shape.bounds.intersects(shape.shape.bounds)) {
                    await delay(recursiveDelay)
                    this.eventLog?.create(`${shape.name} successfully inside SeekRelationship!`, shape)
                    resolve(true);
                } else {
                    shape.seek(this.leader)
                    await delay(recursiveDelay)
                    this.insideRel(shape).then(resolve, reject)
                }
            } else {
                await delay(recursiveDelay)
                this.insideRel(shape).then(resolve, reject)
            }
        });
    }

    removeInside(partner: AdultShape) {
        this.eventLog?.create(`removeInside: ${partner.name} to be removed from inside!`, [partner, this.inside])
        const result = this.inside.delete(partner)

        if(result)
            this.eventLog?.create(`removeInside: ${partner.name} found and removed successfully from inside Set!`, [partner, this.inside])
        else
            this.eventLog?.create(`removeInside: ${partner.name} does not exist in set and was not removed.`, [partner, this.inside])

        return result
    }

    applyRelationshipStart(shape: AdultShape) {
        super.applyRelationshipStart(shape);
        shape.teleport = false

        this.insideRel(shape).then(() => {
            this.inside.add(shape)
            this.eventLog?.create(`${shape.name} added into inside Set`, [shape, this.inside])
        })
    }

    applyRelationshipEnd(shape: AdultShape) {
        super.applyRelationshipStart(shape);
        shape.teleport = true
        this.removeInside(shape)
    }

    findLeader(): AdultShape {
        const leader = randomFromArr(Array.from(this.partners))
        this.eventLog?.create(`Leader chosen as ${leader.name}`, leader)

        this.removeInside(leader)
        return leader
    }

    removePartnerAction(partner: AdultShape) {
        if (partner == this.leader)
            this.leader = this.findLeader()

    }
}