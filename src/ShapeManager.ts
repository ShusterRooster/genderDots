import {Relationship, SeekRelationship} from "./Relationship";
import {randomFromArr} from "./HelperFunctions";
import * as settings from "../Settings";
import {BabyShape, GenderShape} from "./shapeClasses";

export default class ShapeManager {
    babies = new Set<BabyShape>()
    adults = new Set<GenderShape>()
    relationships = new Set<Relationship>()
    openRelationships = new Set<Relationship>()
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
        this.initRelationships()
    }

    initRelationships() {
        const arr = Array.from(this.adults)

        //see if other is within parameters then see if our color is within other's params
        arr.filter((obj) => !obj.isLoner);

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                if (Relationship.mutual(a, b)) {
                    if (a.relationship == undefined && b.relationship == undefined) {
                        const type = randomFromArr(settings.relationshipTypes)

                        if (type == "seek") {
                            const seekRel = new SeekRelationship([a, b], this)
                            this.addRelationship(seekRel)
                        }

                        // if (type == "chain")
                        //     new ChainRelationship([a, b], dotManager)
                    }
                }
            }
        }
    }


    babyToAdult(baby: BabyShape, adult: GenderShape) {
        this.babies.delete(baby)
        this.adults.add(adult)

        baby.shape.remove()

        if(this.adults.size >= this.numWanted / 4)
            this.initRelationships()
    }

    addRelationship(relationship: Relationship) {
        this.relationships.add(relationship)

        if(relationship.open)
            this.openRelationships.add(relationship)
    }

    removeRelationship(relationship: Relationship) {
        this.relationships.delete(relationship)
        this.openRelationships.delete(relationship)
    }

    update() {
        if(this.babies.size > 0) {
            for (const baby of this.babies) {
                baby.run();
            }
        }

        if(this.adults.size > 0) {
            for (const adult of this.adults) {
                adult.run();
            }
        }

        if(this.openRelationships.size > 0) {
            for (const r of this.openRelationships) {
                r.lookForLove()
            }
        }

        if(this.relationships.size > 0) {
            for (const r of this.relationships) {
                r.run()
            }
        }
    }
}
