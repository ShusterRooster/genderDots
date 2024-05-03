import paper from "paper";
import {
    determineProb,
    random,
    randomFromArr, removeFromArray
} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import {ChainWeb} from "./Chain";
import * as settings from "../Settings";
import DotManager from "./DotManager";
import {dot} from "node:test/reporters";
import {maxPartners} from "../Settings";

export class Relationship {
    partners: Set<GenderShape>
    maxPartners = Math.floor(random(2, settings.maxPartners + 1));

    color: paper.Color;
    dotManager: DotManager | undefined

    readyPartners = new Set<GenderShape>()

    constructor(
        partners: GenderShape[],
        dotManager?: DotManager,
        color?: paper.Color) {

        this.partners = new Set(partners);
        this.dotManager = dotManager

        this.color = color ?? paper.Color.random();

        this.applyRelationshipAll()
    }

    static pairShapes(arr: GenderShape[], dotManager: DotManager) {
        //see if other is within parameters then see if our color is within other's params
        arr = arr.filter((obj) => !obj.isLoner);

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                if (this.mutual(a, b)) {
                    if (a.relationship == undefined && b.relationship == undefined) {
                        const type = randomFromArr(settings.relationshipTypes)

                        if (type == "seek")
                            new SeekRelationship([a, b], dotManager)

                        // if (type == "chain")
                        //     new ChainRelationship([a, b], dotManager)
                    }
                }
            }
        }
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
        if (this.readyPartners.size < this.partners.size) {
            for (const partner of this.partners) {
                partner.onReady().then(() => {
                    this.applyRelationship(partner)
                    this.readyPartners.add(partner)
                })
            }
        }

        // if (this.partners.size < this.maxPartners)
        //     this.seekPartners();
    }

    seekPartners() {
        let arr = this.dotManager!.arr;
        arr = arr.filter((obj) => !obj.isLoner);

        setTimeout(() => {
            for (const shape of arr) {
                if (determineProb(settings.stealChance)) {
                    this.addPartner(shape);
                }
            }
        }, settings.seekInterval)
    }

    applyRelationship(shape: GenderShape) {
        shape.relationship = this;
        if (shape.ready) {
            shape.colorManager.color = this.color;
            shape.colorManager.relationshipColor = this.color
        }
    }

    applyRelationshipAll() {
        for (const shape of this.partners) {
            this.applyRelationship(shape);
        }
    }

    removePartner(partner: GenderShape) {
        if(this.partners.has(partner)){
            this.partners.delete(partner)

            if(this.readyPartners.has(partner))
                this.readyPartners.delete(partner)

            return true
        }

        return false
    }


    addPartner(partner: GenderShape) {
        if (this.partners.size < this.maxPartners && !this.partners.has(partner)) {
            if (this.allMutual(partner)) {
                if (partner.relationship)
                    partner.relationship.removePartner(partner)

                this.applyRelationship(partner)
                this.partners.add(partner)

                if (partner.ready) this.readyPartners.add(partner)

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
        dotManager?: DotManager,
        color?: paper.Color) {

        super(partners, dotManager, color)
    }

    run() {
        super.run()
        this.seek();
    }

    determineAttractor(): GenderShape {
        return randomFromArr(Array.from(this.readyPartners))
    }

    removePartner(partner: GenderShape): boolean {
        const result = super.removePartner(partner);

        if(result) {
            if(this.attractor == partner)
                this.attractor = this.determineAttractor()
        }

        return result
    }

    seek() {
        if (this.attractor == undefined)
            this.attractor = this.determineAttractor();

        else {
            for (const shape of this.readyPartners) {
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
        dotManager?: DotManager,
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
    removePartner(partner: GenderShape): boolean {
        const result = super.removePartner(partner)

        if (result) {
            this.chainWeb.removePartner(partner)
        }

        return result
    }

    addPartner(partner: GenderShape) {
        if (this.partners.size < this.maxPartners && !this.partners.has(partner)) {
            if (this.allMutual(partner)) {
                if (partner.relationship) {

                    partner.relationship.removePartner(partner)

                }

                this.applyRelationship(partner)
                this.partners.add(partner)

                if (partner.ready) this.readyPartners.add(partner)

            }
        }
    }


    // addPartner(partner: GenderShape): boolean {
    //     const result = super.addPartner(partner)
    //
    //     if (result) {
    //         if (partner.relationship instanceof ChainRelationship)
    //
    //
    //
    //         this.chainWeb.addPartner(partner)
    //     }
    //
    //     return result
    // }
}
