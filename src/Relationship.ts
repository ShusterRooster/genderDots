import paper from "paper";
import {random, randomFromArr} from "./HelperFunctions";
import {GenderShape} from "./shapeClasses";
import {ChainWeb} from "./Chain";
import * as settings from "../Settings";
import ShapeManager from "./ShapeManager";

export class Relationship {
    partners: Set<GenderShape>
    maxPartners = Math.floor(random(2, settings.maxPartners + 1));

    color: paper.Color;
    shapeManager: ShapeManager

    protected _open: boolean

    constructor(
        partners: GenderShape[],
        shapeManager: ShapeManager,
        color?: paper.Color) {

        this.partners = new Set(partners);
        this.shapeManager = shapeManager
        this.color = color ?? paper.Color.random();

        this._open = this.checkOpen()

        this.applyRelationshipAll()
    }

    checkOpen() {
        const cond = this.partners.size < this.maxPartners

        //if not changed
        if(this._open == cond)
            return this._open

        //else
        this.open = cond
        return this._open;
    }

    set open(open: boolean) {
        if(this._open == open)
            return

        else if(!open) //if closed
            this.shapeManager.openRelationships.delete(this)

        else //if open and value is new
            this.shapeManager.openRelationships.add(this)

        this._open = open
    }

    static mutual(a: GenderShape, b: GenderShape) {
        return a.attractedTo(b) && b.attractedTo(a);
    }

    allMutual(partner: GenderShape) {
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
        this.checkOpen()
    }

    getFirstInSet(set: Set<any>) {
        for(let item of set) {
            return item;
        }
        return undefined;
    }

    lookForLove() {
        for (const shape of this.shapeManager.adults) {

            if(!shape.attractedTo(this.getFirstInSet(this.partners)))
                continue

            if(this.allMutual(shape))
                this.addPartner(shape)
        }
    }

    applyRelationship(shape: GenderShape) {
        shape.relationship = this;
        shape.relationshipColor = this.color
        shape.applyColor(this.color)
    }

    applyRelationshipAll() {
        for (const shape of this.partners) {
            this.applyRelationship(shape);
        }
    }

    removePartner(partner: GenderShape) {
        if (this.partners.has(partner)) {

            if (this.partners.size - 1 == 0) {
                this.endRelationship()
                return
            }

            this.partners.delete(partner)

            return true
        }

        return false
    }

    endRelationship() {
        this.partners.forEach((p) => {
            p.relationship = undefined
        })

        this.shapeManager?.removeRelationship(this)
    }


    addPartner(partner: GenderShape) {
        if (this.partners.size < this.maxPartners && !this.partners.has(partner)) {
            if (this.allMutual(partner)) {
                if (partner.relationship)
                    partner.relationship.removePartner(partner)

                this.applyRelationship(partner)
                this.partners.add(partner)

                return true
            }
        }

        return false
    }
}

export class SeekRelationship extends Relationship {

    attractor: GenderShape | undefined

    constructor(
        partners: GenderShape[],
        dotManager: ShapeManager,
        color?: paper.Color) {

        super(partners, dotManager, color)
    }

    run() {
        super.run()
        this.seek();
    }

    determineAttractor(): GenderShape {
        return randomFromArr(Array.from(this.partners))
    }

    removePartner(partner: GenderShape) {
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
        partners: GenderShape[],
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

    removePartner(partner: GenderShape) {
        const result = super.removePartner(partner)

        if (result) {
            this.chainWeb.removePartner(partner)
        }

        return result
    }

    addPartner(partner: GenderShape) {
        const result = super.addPartner(partner)

        if (result) {
            this.chainWeb.addPartner(partner)
        }

        return result
    }
}
