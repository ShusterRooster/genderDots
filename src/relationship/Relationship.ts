import {determineProb, generateID, getAttrFromArray, random, randomFromArr} from "../HelperFunctions";
import {debugMode, maxPartners, stealChance} from "../../Settings";
import ShapeManager from "../ShapeManager";
import AdultShape from "../AdultShape";
import EventLog from "../EventLog";

/**
 * Base class for Relationships. Functionality added through extending class.
 */
export default class Relationship {
    name: string
    partners: Set<AdultShape>
    maxPartners = Math.floor(random(2, maxPartners + 1));
    shapeManager: ShapeManager

    /**
     * Boolean for determining whether a relationship is open (accepting of new partners)
     */
    open: boolean
    eventLog?: EventLog

    constructor(
        partners: AdultShape[],
        shapeManager: ShapeManager) {

        this.partners = new Set(partners);
        this.shapeManager = shapeManager
        this.open = this.checkOpen()
        this.name = generateID(this, this.shapeManager.relationships)

        if(debugMode) {
            this.eventLog = new EventLog(this)
            this.eventLog.create(`Relationship initialized`)
        }
    }

    /**
     * Checks if a relationship is capable of accepting new partners.
     */
    checkOpen() {
        const open = this.partners.size < this.maxPartners

        if (!open)
            this.shapeManager.removeFromOpen(this)
        else
            this.shapeManager.openRelationships.push(this)

        this.open = open
        return this.open;
    }

    /**
     * Checks if two AdultShapes are attracted to each other.
     * @param a
     * @param b
     */
    static mutual(a: AdultShape, b: AdultShape) {
        return a.attractedTo(b) && b.attractedTo(a);
    }

    /**
     * Checks if a new potential partner is mutually attracted to all the partners in the existing relationship
     * @param partner
     */
    allMutual(partner: AdultShape) {
        const arr = Array.from(this.partners)
        arr.push(partner)

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                if (!Relationship.mutual(a, b)) return false;
            }
        }

        return true;
    }

    run() {
    }

    /**
     * Determines if a relationship is ready to teleport when it meets certain criteria. Varies by relationship type
     */
    readyToTeleport() {
        for (const shape of this.partners) {
            if (!shape.outOfBounds()) {
                return false
            }
        }

        return true
    }

    teleportAll() {
        this.eventLog?.create(`Partners teleported opposite!`)

        for (const part of this.partners) {
            part.teleportOpposite()
        }
    }

    lookForLove() {
        const shape = randomFromArr(Array.from(this.shapeManager.adults))
        this.eventLog?.create(`Looking for love!: ${shape.name}`, shape)

        if (this.partners.has(shape) || shape.isLoner) {
            this.eventLog?.create(`Looking for love failed: already here or isLoner`, shape)
            return;
        }

        if (shape.inRelationship) {
            if (determineProb(stealChance)) {
                this.eventLog?.create(`Steal chance won!`)
                this.addPartner(shape)
                return
            }
        } else if (this.allMutual(shape)) {
            this.addPartner(shape)
            return
        }
    }

    info() {
        let partnerStr = getAttrFromArray(this, this.partners, "name")
        return `${this.name}<br>partners: ${partnerStr}`
    }

    /**
     * Applies conditions to a shape when it is entering a relationship. Usually state changes
     * @param shape
     */
    applyRelationshipStart(shape: AdultShape) {
        shape.relationship = this;
        this.eventLog?.create(`Applied relationship start, ${shape.name}`, shape)
    }

    /**
     * Applies conditions to a shape for when it is leaving a relationship.
     * @param shape
     */
    applyRelationshipEnd(shape: AdultShape) {
        shape.relationship = undefined;
        this.eventLog?.create(`Applied relationship end, ${shape.name}`, shape)
    }

    applyStartRelationshipAll() {
        this.eventLog?.create(`Relationship start applied to all!`)

        for (const shape of this.partners) {
            this.applyRelationshipStart(shape);
        }
    }

    applyEndRelationshipAll() {
        this.eventLog?.create(`Relationship end applied to all!`)

        for (const shape of this.partners) {
            this.applyRelationshipEnd(shape);
        }
    }

    removePartner(partner: AdultShape) {
        if (this.partners.has(partner)) {

            if (this.partners.size - 1 == 0) {
                this.endRelationship()
                return
            }

            this.eventLog?.create(`Partner removed! ${partner.name}`, partner)
            this.partners.delete(partner)
            this.removePartnerAction(partner)
            this.applyRelationshipEnd(partner)
            this.checkOpen()

            return true
        }

        return false
    }

    endRelationship() {
        this.eventLog?.create("Relationship ended :(", this)
        this.applyEndRelationshipAll()
        this.shapeManager?.removeRelationship(this)
    }

    /**
     * Action to run when a partner is added.
     * @param partner
     */
    addPartnerAction(partner?: AdultShape) {

    }

    /**
     * Action to run when a partner is removed.
     * @param partner
     */
    removePartnerAction(partner?: AdultShape) {

    }

    removePartnerGlobal(partner: AdultShape) {
        this.eventLog?.create(`removePartnerGlobal() Started`, partner)

        for (const rel of this.shapeManager.relationships) {
            if (rel == this)
                continue

            if (rel.partners.has(partner)) {
                rel.removePartner(partner)

                this.eventLog?.create(
                    `${partner.name} has been removed from ${rel.name}`,
                    [partner, rel])
            }
        }
    }

    addPartner(partner: AdultShape) {
        this.eventLog?.create(`addPartner check!, ${partner.name}!`, partner)

        if(partner.isLoner) {
            this.eventLog?.create(`failed addPartner ${partner.name}, isLoner`, partner)
            return false
        }

        if (this.partners.size < this.maxPartners &&
            !this.partners.has(partner) &&
            this.allMutual(partner)) {

            this.partners.add(partner)
            this.removePartnerGlobal(partner)

            this.addPartnerAction(partner)
            this.applyRelationshipStart(partner)

            this.eventLog?.create(`Succeed! Added partner ${partner.name}!`, partner)

            this.checkOpen()
            return true
        }

        this.eventLog?.create(`addPartner failed!, ${partner.name}!`, partner)
        return false
    }
}