import paper from "paper";
import {determineProb, random, randomFromArr} from "./HelperFunctions";
import {ChainWeb} from "./Chain";
import * as settings from "../Settings";
import ShapeManager from "./ShapeManager";
import AdultShape from "./AdultShape";
import {stealChance} from "../Settings";

export class Relationship {
    partners: Set<AdultShape>
    maxPartners = Math.floor(random(2, settings.maxPartners + 1));

    color: paper.Color;
    shapeManager: ShapeManager

    open: boolean

    constructor(
        partners: AdultShape[],
        shapeManager: ShapeManager,
        color?: paper.Color) {

        this.partners = new Set(partners);
        this.shapeManager = shapeManager
        this.color = color ?? paper.Color.random();

        this.open = this.checkOpen()

        this.applyRelationshipAll()
    }

    checkOpen() {
        const open = this.partners.size < this.maxPartners

        if(!open)
            this.shapeManager.openRelationships.delete(this)
        else
            this.shapeManager.openRelationships.add(this)

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
        // this.checkOpen()
    }

    getFirstInSet(set: Set<any>) {
        for(let item of set) {
            return item;
        }
        return undefined;
    }

    lookForLove() {
        if(!determineProb(stealChance))
            return

        console.log("steal chance!!!")

        for (const shape of this.shapeManager.adults) {

            if(!shape.attractedTo(this.getFirstInSet(this.partners)))
                continue

            if(this.allMutual(shape))
                this.addPartner(shape)
        }
    }

    applyRelationship(shape: AdultShape) {
        shape.relationship = this;
        shape.relationshipColor = this.color
        shape.applyColor(this.color)
    }

    applyRelationshipAll() {
        for (const shape of this.partners) {
            this.applyRelationship(shape);
        }
    }

    removePartner(partner: AdultShape) {
        if (this.partners.has(partner)) {

            if (this.partners.size - 1 == 0) {
                this.endRelationship()
                return
            }

            this.partners.delete(partner)

            return true
        }
        this.checkOpen()

        return false
    }

    endRelationship() {
        this.partners.forEach((p) => {
            p.relationship = undefined
        })

        this.shapeManager?.removeRelationship(this)
    }


    addPartner(partner: AdultShape) {
        if (this.partners.size < this.maxPartners && !this.partners.has(partner)) {
            if (this.allMutual(partner)) {
                if (partner.relationship)
                    partner.relationship.removePartner(partner)

                this.applyRelationship(partner)
                this.partners.add(partner)
                console.log("partner added")

                return true
            }
        }
        this.checkOpen()

        return false
    }
}

export class SeekRelationship extends Relationship {

    attractor: AdultShape | undefined

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager,
        color?: paper.Color) {

        super(partners, dotManager, color)
    }

    run() {
        super.run()
        this.seek();
    }

    determineAttractor(): AdultShape {
        return randomFromArr(Array.from(this.partners))
    }

    removePartner(partner: AdultShape) {
        const result = super.removePartner(partner);

        if (result) {
            if (this.attractor == partner)
                this.attractor = this.determineAttractor()
        }

        return result
    }

    seek() {
        if (this.attractor == undefined)
            this.attractor = this.determineAttractor();

        else {
            for (const shape of this.partners) {
                if (shape !== this.attractor) {
                    shape.seek(this.attractor);
                }
            }
        }
    }
}

export class ChainRelationship extends Relationship {

    chainWeb: ChainWeb

    constructor(
        partners: AdultShape[],
        dotManager: ShapeManager,
        color?: paper.Color) {

        super(partners, dotManager, color)
        this.chainWeb = new ChainWeb(this.partners)
    }

    run() {
        super.run()
        this.chainWeb.run()
    }

    chain() {
        if (this.chainWeb == undefined) {
            this.chainWeb = new ChainWeb(this.partners)
            console.log(this.chainWeb)
        } else
            this.chainWeb.run()
    }

    removePartner(partner: AdultShape) {
        const result = super.removePartner(partner)

        if (result) {
            this.chainWeb.removePartner(partner)
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
