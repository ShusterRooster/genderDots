import paper from "paper";
import {
    determineProb,
    random,
    randomFromArr
} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import {ChainWeb} from "./Chain";
import * as settings from "../Settings";
import DotManager from "./DotManager";

export class Relationship {
    partners: GenderShape[];
    maxPartners = Math.floor(random(2, settings.maxPartners + 1));

    attractor: GenderShape | undefined;
    chainWeb: ChainWeb | undefined

    color: paper.Color;
    dotManager: DotManager | undefined

    relationshipType = randomFromArr(settings.relationshipTypes);

    constructor(
        partners: GenderShape[],
        color?: paper.Color) {

        this.partners = partners;
        this.dotManager = this.partners[0].dotManager

        this.applyRelationshipAll();

        this.color = color ?? paper.Color.random();
    }

    static pairShapes(arr: GenderShape[]) {
        //see if other is within parameters then see if our color is within other's params
        arr = arr.filter((obj) => !obj.isLoner);

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                if (a.attractedTo(b) && b.attractedTo(a)) {
                    if (a.relationship == undefined && b.relationship == undefined) {
                        new Relationship([a, b]);
                    }
                }
            }
        }
    }

    seekPartners() {
        let arr = this.dotManager!.arr;
        arr = arr.filter((obj) => !obj.isLoner);
        arr = arr.filter((obj) => obj.relationship == undefined);


        for (const shape of arr) {
            if (determineProb(settings.stealChance)) {
                this.addPartner(shape);
            }
        }
    }

    run() {
        this.applyRelationshipAll();
        if (this.relationshipType == "seek") this.seek();
        else if (this.relationshipType == "chain") {
            if(this.chainWeb == undefined){
                this.chainWeb = new ChainWeb(this.readyPartnersArr())
            }
            else if (this.chainWeb.chainArr.length < this.readyPartnersArr().length * (this.readyPartnersArr().length - 1)) {
                this.regenChains()
            }
            else {
                this.chainWeb!.run()
            }
        }

        if(this.partners.length < this.maxPartners)
            this.seekPartners();
    }

    static mutual(a: GenderShape, b: GenderShape) {
        return a.attractedTo(b) && b.attractedTo(a);
    }

    static allMutual(arr: GenderShape[]) {
        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                if (!this.mutual(a, b)) return false;
            }
        }

        return true;
    }

    static getAvgFromArr(objects: any[], attr: keyof any) {
        if (objects.length === 0) return 0; // Handle edge case where array is empty
        const total = objects.reduce((sum, obj) => sum + obj[attr], 0);
        return total / objects.length;
    }

    applyRelationshipAll() {
        for (const shape of this.partners) {
            this.applyRelationship(shape);
        }
    }

    applyRelationship(shape: GenderShape) {
        shape.relationship = this;
        if (shape.ready) {
            shape.colorManager.color = this.color;
            shape.colorManager.relationshipColor = this.color
        }
    }

    determineAttractor(): GenderShape {
        return randomFromArr(this.readyPartnersArr())
    }

    seek() {
        if (this.attractor == undefined)
            this.attractor = this.determineAttractor();

        else if (this.attractor) {
            for (const shape of this.readyPartnersArr()) {
                if (shape !== this.attractor) {
                    shape.seek(this.attractor);
                }
            }
        }
    }

    regenChains() {
        this.chainWeb?.removeAll()
        this.chainWeb = undefined
        this.chainWeb = new ChainWeb(this.readyPartnersArr())
    }

    remove(shape: GenderShape) {
        const index = this.partners.indexOf(shape)
        this.partners.splice(index, 1)
    }

    readyPartnersArr() {
        const arr = this.partners;
        return arr.filter((obj) => obj.ready);
    }

    addPartner(partner: GenderShape) {
        const arr = this.partners;
        arr.push(partner);

        if (Relationship.allMutual(arr) &&
            this.partners.length < this.maxPartners) {
            partner.relationship?.remove(partner)

            if(this.chainWeb !== undefined)
                this.regenChains()

            this.applyRelationship(partner)
            this.partners.push(partner);
        }
    }
}
