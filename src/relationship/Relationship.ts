import {determineProb, random, randomFromArr} from "../HelperFunctions";
import {ChainWeb} from "./Chain";
import * as settings from "../../Settings";
import {stealChance} from "../../Settings";
import ShapeManager from "../ShapeManager";
import AdultShape from "../AdultShape";
import Orbit from "./Orbit";

export class Relationship {
    partners: Set<AdultShape>
    maxPartners = Math.floor(random(2, settings.maxPartners + 1));

    shapeManager: ShapeManager

    open: boolean

    constructor(
        partners: AdultShape[],
        shapeManager: ShapeManager) {

        this.partners = new Set(partners);
        this.shapeManager = shapeManager

        this.open = this.checkOpen()

        this.applyStartRelationshipAll()
    }

    checkOpen() {
        const open = this.partners.size < this.maxPartners

        if (!open)
            this.shapeManager.removeFromOpen(this)
        else
            this.shapeManager.openRelationships.push(this)

        this.open = open
        return this.open;
    }

    static mutual(a: AdultShape, b: AdultShape) {
        return a.attractedTo(b) && b.attractedTo(a);
    }

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

    readyToTeleport() {
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

        for (const shape of this.shapeManager.adults) {

            if (this.partners.has(shape))
                continue

            if (shape.inRelationship && this.allMutual(shape)) {
                if (determineProb(stealChance)) {
                    this.addPartner(shape)
                    return
                }
            } else if (this.allMutual(shape)) {
                this.addPartner(shape)
                return
            }
        }
    }

    applyRelationshipStart(shape: AdultShape) {
        shape.relationship = this;
        shape.inRelationship = true
    }

    applyRelationshipEnd(shape: AdultShape) {
        shape.relationship = undefined;
        shape.inRelationship = false
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

    removePartner(partner: AdultShape) {
        if (this.partners.has(partner)) {

            if (this.partners.size - 1 == 0) {
                this.endRelationship()
                return
            }

            this.applyRelationshipEnd(partner)
            this.partners.delete(partner)

            return true
        }
        this.checkOpen()

        return false
    }

    endRelationship() {
        this.applyEndRelationshipAll()
        this.shapeManager?.removeRelationship(this)
    }

    addPartner(partner: AdultShape) {
        if (this.partners.size < this.maxPartners && !this.partners.has(partner)) {
            if (this.allMutual(partner)) {
                if (partner.inRelationship) {
                    partner.relationship!.removePartner(partner)
                }

                this.applyRelationshipStart(partner)
                this.partners.add(partner)

                return true
            }
        }
        this.checkOpen()

        return false
    }
}

export class SeekRelationship extends Relationship {

    attractor: AdultShape

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager) {

        super(partners, dotManager)
        this.attractor = this.determineAttractor()
    }

    run() {
        this.seek();
    }

    applyRelationshipStart(shape: AdultShape) {
        super.applyRelationshipStart(shape);
        shape.seeking = true
        shape.teleport = false
    }

    applyRelationshipEnd(shape: AdultShape) {
        super.applyRelationshipStart(shape);
        shape.seeking = false
        shape.teleport = true
    }

    determineAttractor(): AdultShape {
        return randomFromArr(Array.from(this.partners))
    }

    removePartner(partner: AdultShape) {
        const result = super.removePartner(partner);

        if (result) {
            if (partner == this.attractor)
                this.attractor = this.determineAttractor()

            partner.seeking = false
        }

        return result
    }

    seek() {
        if (this.attractor.outOfBounds()) {
            if(this.readyToTeleport()) {
                this.teleportAll()
            }
        }

        for (const shape of this.partners) {
            if (shape !== this.attractor) {
                shape.seek(this.attractor);
            }
        }
    }
}

export class ChainRelationship extends Relationship {

    chainWeb: ChainWeb

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager) {

        super(partners, dotManager)
        this.chainWeb = new ChainWeb(this.partners)
    }

    run() {
        this.chainWeb.run()
    }

    removePartner(partner: AdultShape) {
        const result = super.removePartner(partner)

        if (result) {
            this.chainWeb.removePartner(partner)
        } else {
            this.chainWeb.removeAll()
        }

        return result
    }

    addPartner(partner: AdultShape) {
        const result = super.addPartner(partner)

        if (result) {
            this.chainWeb.addPartner(partner)
        }

        return result
    }
}

export class OrbitRelationship extends Relationship {

    orbit: Orbit

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager) {

        super(partners, dotManager)
        this.orbit = new Orbit(this)
    }

    run() {
        this.orbit.orbit()
    }

    applyRelationshipStart(shape: AdultShape) {
        super.applyRelationshipStart(shape);
        shape.teleport = false
    }

    applyRelationshipEnd(shape: AdultShape) {
        super.applyRelationshipStart(shape);
        shape.teleport = true
    }

    removePartner(partner: AdultShape) {
        const result = super.removePartner(partner)

        if (result) {
            this.orbit.removePartner(partner)
        } else {
            this.orbit.removeAll()
        }

        return result
    }

    addPartner(partner: AdultShape) {
        const result = super.addPartner(partner)

        if (result) {
            this.orbit.addPartner(partner)
        }

        return result
    }
}

export class MergeRelationship extends Relationship {

    orbit: Orbit

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager) {

        super(partners, dotManager)
        this.orbit = new Orbit(this)
    }

    run() {
        this.orbit.orbit()
    }

    removePartner(partner: AdultShape) {
        const result = super.removePartner(partner)

        if (result) {
            this.orbit.removePartner(partner)
        } else {
            this.orbit.removeAll()
        }

        return result
    }

    addPartner(partner: AdultShape) {
        const result = super.addPartner(partner)

        if (result) {
            this.orbit.addPartner(partner)
        }

        return result
    }
}

