import paper from "paper";
import {
    determineProb,
    PathArray,
    random,
    randomFromArr, Relation,
} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import {ChainWeb} from "./Chain";

export class Relationship {
    partners: GenderShape[];
    maxPartners = Math.floor(random(2, Relation.maxPartners + 1));

    attractor: GenderShape | undefined;
    orbitCircle: paper.Path.Circle | undefined;
    chainWeb: ChainWeb | undefined

    color: paper.Color;
    attractionType: string;

    relationshipType = randomFromArr(Relation.relationshipTypes);
    partnersReady = false;

    constructor(
        partners: GenderShape[],
        attractionType: string,
        color?: paper.Color
    ) {
        this.partners = partners;
        this.attractionType = attractionType;

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
                        const rel = new Relationship([a, b], a.attractionType);
                    }
                }
            }
        }
    }

    get dotManager() {
        return this.partners[0].dotManager;
    }

    seekPartners() {
        let arr = this.dotManager!.arr;
        arr = arr.filter((obj) => !obj.isLoner);
        // arr = arr.filter((obj) => obj.relationship == undefined);


        for (const shape of arr) {
            if (determineProb(Relation.stealChance)) {
                this.addPartner(shape);
            }
        }
    }

    run() {
        this.applyRelationshipAll();
        if (this.relationshipType == "seek") this.seek();
        // else if (this.relationshipType == "orbit") this.orbit();
        else if (this.relationshipType == "chain") {
            if(this.chainWeb == undefined)
                this.chainWeb = new ChainWeb(this.readyPartnersArr())
            else
                this.chainWeb.run()
        }
        else if (this.relationshipType == "merge") this.merge();

        // this.seekPartners();
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

    determineAttractor() {
        const arr = this.readyPartnersArr()

        arr.sort((a, b) => b.endSize - a.endSize);
        return arr[0];
    }

    seek() {
        if (this.attractor == undefined) {
            this.attractor = this.determineAttractor();
        }

        for (const shape of this.readyPartnersArr()) {
            if (shape !== this.attractor) {
                shape.seek(this.attractor);
            }
        }
    }

    calcOrbit() {
        let pointTotal = new paper.Point(0, 0);
        let sizeTotal = 0;

        for (const shape of this.readyPartnersArr()) {
            pointTotal = pointTotal.add(shape.position);
            sizeTotal += shape.radius + shape.genitalEndHeight;
        }

        pointTotal = pointTotal.divide(this.readyPartnersArr().length);
        sizeTotal /= this.readyPartnersArr().length;

        this.orbitCircle = new paper.Path.Circle(pointTotal, sizeTotal);

        //@ts-ignore
        this.orbitCircle.strokeColor = "blue";
    }

    orbit() {
        if (this.orbitCircle == undefined) this.calcOrbit();

        for (const shape of this.readyPartnersArr()) {
            if (!this.orbitCircle!.intersects(shape.shape)) {
                shape.seek(this.orbitCircle!.position);
            } else {
                const offset = this.orbitCircle!.length / shape.radius;
                const point = this.orbitCircle!.getPointAt(offset);

                shape.seek(point);
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
        const avgColor = this.getAvgColor();
        const sex = this.getCombinedSex();

        const obj = this.readyPartnersArr()[0];

        for (const shape of this.readyPartnersArr()) {
            shape.dotManager?.remove(shape);
        }

        const newShape = new GenderShape({
            dotManager: obj.dotManager,
            spawnPoint: obj.position,
            radius: avgRad,
            distance: 0,
            sex: sex,
            genitalWidth: avgWidth,
            genitalEndHeight: avgHeight,
            color: avgColor,
        });

        obj.dotManager?.arr.push(newShape);
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

        if (
            Relationship.allMutual(arr) &&
            this.partners.length < this.maxPartners
        ) {
            this.partners.push(partner);
            //   partner.colorManager.color = this.color;
        }
    }
}
