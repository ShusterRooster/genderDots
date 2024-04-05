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
    orbitCircle: paper.Path.Circle | undefined;
    chainWeb: ChainWeb | undefined

    color: paper.Color;
    dotManager: DotManager | undefined

    relationshipType = randomFromArr(settings.relationshipTypes);
    partnersReady = false;

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
            else if (this.chainWeb!.arr.length < this.readyPartnersArr().length) {
                this.chainWeb?.removeAll()
                this.chainWeb = undefined

                this.chainWeb = new ChainWeb(this.readyPartnersArr())
            }
            else {
                this.chainWeb!.run()
            }
        }
        else if (this.relationshipType == "merge") this.merge();

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

    getCombinedSex() {
        const arr = this.partners;
        const allEqual = arr.every((val) => val.sex === arr[0].sex);

        if (allEqual) return arr[0].sex;
        else return "intersex";
    }

    getAvgColor() {
        let totalColor = 0

        for (const shape of this.readyPartnersArr()) {
            totalColor += shape.colorManager.color.gray
        }

        totalColor /= this.readyPartnersArr().length;
        return new paper.Color(totalColor)
    }

    mergeShape() {
        const avgRad = Relationship.getAvgFromArr(this.readyPartnersArr(), "radius");
        const avgHeight = Relationship.getAvgFromArr(
            this.readyPartnersArr(),
            "genitalEndHeight"
        );
        const avgWidth = Relationship.getAvgFromArr(this.readyPartnersArr(), "genitalWidth");
        const sex = this.getCombinedSex();

        const obj = this.readyPartnersArr()[0];

        const newShape = new GenderShape({
            dotManager: this.dotManager,
            spawnPoint: obj.position,
            radius: avgRad,
            distance: 0,
            sex: sex,
            genitalWidth: avgWidth,
            genitalEndHeight: avgHeight,
            color: this.color,
        });

        obj.dotManager?.arr.push(newShape);
        this.partners.push(newShape)

        for (const shape of this.readyPartnersArr()) {
            if(shape !== newShape)
                this.dotManager?.remove(shape)
        }
    }

    merge() {
        this.seek();

        for (const shape of this.readyPartnersArr()) {
            if (shape !== this.attractor && this.attractor) {
                if (this.attractor?.shape.contains(shape.position)) {
                    this.mergeShape();
                }
            }
        }
    }

    allPartnersReady() {
        return !this.partners.some((shape) => !shape.ready);
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
            this.partners.push(partner);
            //   partner.colorManager.color = this.color;
        }
    }
}
