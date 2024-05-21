import {ChainRelationship, Relationship, SeekRelationship} from "./Relationship";
import {randomFromArr} from "./HelperFunctions";
import {relationshipTypes} from "../Settings";
import paper from "paper";
import BabyShape from "./BabyShape";
import AdultShape from "./AdultShape";

export default class ShapeManager {
    babies = new Set<BabyShape>()
    adults = new Set<AdultShape>()
    relationships = new Set<Relationship>()
    openRelationships = new Set<Relationship>()
    relationshipsInit = false
    numWanted: number

    constructor(numWanted: number) {
        this.relationships = new Set();
        this.numWanted = numWanted;
        this.initDots();
    }

    initDots() {
        for (let i = 0; i < this.numWanted!; i++) {
            const shape = new BabyShape({dotManager: this});
            this.babies.add(shape)
        }

        // console.log(this.babies)
    }

    initRelationships() {
        const arr = Array.from(this.adults)

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                if (Relationship.mutual(a, b)) {
                    if (a.relationship == undefined && b.relationship == undefined) {
                        const type = randomFromArr(relationshipTypes)

                        if (type == "seek") {
                            const seekRel = new SeekRelationship([a, b], this)
                            this.addRelationship(seekRel)
                        }

                        if (type == "chain") {
                            const chainRel = new ChainRelationship([a, b], this)
                            this.addRelationship(chainRel)
                        }
                    }
                }
            }
        }
    }


    babyToAdult(baby: BabyShape, adult: AdultShape) {
        this.babies.delete(baby)
        this.adults.add(adult)
        baby.shape.remove()
        this.initRelationships()

        // if (this.adults.size >= this.numWanted * 0.75 && !this.relationshipsInit) {
        //     this.initRelationships()
        //     this.relationshipsInit = true
        // }
    }

    addRelationship(relationship: Relationship) {
        this.relationships.add(relationship)

        if (relationship.open)
            this.openRelationships.add(relationship)
    }

    removeRelationship(relationship: Relationship) {
        this.relationships.delete(relationship)
        this.openRelationships.delete(relationship)
    }

    update = () => {

        for (const baby of this.babies) {
            baby.run();
        }

        for (const adult of this.adults) {
            adult.run();
        }

        // for (const r of this.openRelationships) {
        //     r.lookForLove()
        // }

        for (const r of this.relationships) {
            r.run()
        }

        paper.view.requestUpdate()
        requestAnimationFrame(this.update)
    }
}
