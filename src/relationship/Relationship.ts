import {delay, determineProb, generateID, getAttrFromArray, random, randomFromArr} from "../HelperFunctions";
import {maxPartners, recursiveDelay, stealChance} from "../../Settings";
import ShapeManager from "../ShapeManager";
import AdultShape from "../AdultShape";

/**
 * Base class for Relationships. Functionality added through extending class.
 */
export default abstract class Relationship {
    name: string
    partners: Set<AdultShape>
    maxPartners = Math.floor(random(2, maxPartners + 1));
    shapeManager: ShapeManager

    /**
     * Boolean for determining whether a relationship is open (accepting of new partners)
     */
    open: boolean

    protected constructor(
        partners: AdultShape[],
        shapeManager: ShapeManager) {

        this.partners = new Set(partners);
        this.shapeManager = shapeManager
        this.open = this.checkOpen()
        this.name = generateID(this, this.shapeManager.relationships)
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
    outOfBounds() {
        for (const shape of this.partners) {
            if (!shape.outOfBounds()) {
                return false
            }
        }

        return true
    }

    teleportAll() {
        for (const part of this.partners) {
            part.teleportOpposite()
        }
    }

    lookForLove() {
        const shape = randomFromArr(Array.from(this.shapeManager.adults))

        if (this.partners.has(shape)) {
            return;
        }

        if (shape.isLoner) {
            return;
        }

        if (shape.inRelationship) {
            if (determineProb(stealChance)) {
                this.addPartner(shape)
                return
            }
        } else {
            this.addPartner(shape)
            return
        }
    }

    async addPartner(partner: AdultShape) {

        if (partner.isLoner) {
            return false
        }

        if (partner.pending) {
            return false
        }

        if (this.partners.size < this.maxPartners &&
            !this.partners.has(partner) &&
            this.allMutual(partner)) {

            partner.pendingRelationship = this

            partner.promiseInBounds().then(() => {
                this.removePartnerGlobal(partner, this).then(() => {
                    this.partners.add(partner)
                    this.applyRelationshipStart(partner)
                    partner.pendingRelationship = undefined

                    this.checkOpen()
                    return true
                })
            })
        } else {
            return false
        }

        return false
    }

    async removePartner(partner: AdultShape, relationship: Relationship) {
        if (this.partners.has(partner)) {


            if (this.partners.size - 1 == 0) {
                this.endRelationship()
                return false
            }

            partner.promiseInBounds().then(() => {
                this.partners.delete(partner)
                this.applyRelationshipEnd(partner)
                this.checkOpen()

                return true
            })
        }

        return false
    }

    async removePartnerGlobal(partner: AdultShape, relationship: Relationship) {
        for (const rel of this.shapeManager.relationships) {
            if (rel == this)
                continue

            if (rel.partners.has(partner)) {
                rel.removePartner(partner, relationship).then(() => {
                    return
                })
            }
        }

        return
    }

    /**
     * Applies conditions to a shape when it is entering a relationship. Usually state changes
     * @param shape
     */
    applyRelationshipStart(shape: AdultShape) {
        shape.relationship = this;
    }

    /**
     * Applies conditions to a shape for when it is leaving a relationship.
     * @param shape
     */
    applyRelationshipEnd(shape: AdultShape) {
        shape.relationship = undefined;
    }

    applyStartRelationshipAll() {
        for (const shape of this.partners) {
            this.applyRelationshipStart(shape);
        }
    }

    applyEndRelationshipAll() {
        for (const shape of this.partners) {
            this.applyRelationshipEnd(shape);
        }
    }

    allInBounds() {
        for (const p of this.partners) {
            if (p.outOfBounds()) return false
        }

        return true
    }

    promiseInBounds() {
        return new Promise(async (resolve) => {
            if (this.allInBounds()) {
                resolve(true);
            } else {
                await delay(recursiveDelay)
                this.promiseInBounds().then(resolve)
            }
        });
    }

    info() {
        let partnerStr = getAttrFromArray(this, this.partners, "name")
        return `${this.name}<br>partners: ${partnerStr}`
    }

    endRelationship() {
        this.promiseInBounds().then(() => {
            this.applyEndRelationshipAll()
            this.shapeManager?.removeRelationship(this)
        })
    }
}