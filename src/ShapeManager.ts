import {ChainRelationship, OrbitRelationship, Relationship, SeekRelationship} from "./relationship/Relationship";
import {randomFromArr} from "./HelperFunctions";
import {relationshipTypes, seekInterval} from "../Settings";
import paper from "paper";
import BabyShape from "./BabyShape";
import AdultShape from "./AdultShape";

export default class ShapeManager {
    babies = new Set<BabyShape>()
    adults = new Set<AdultShape>()
    relationships = new Set<Relationship>()
    openRelationships: Relationship[] = []
    relationshipsInit = false
    intervalActive = false
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

                        // if (type == "seek") {
                        //     const seekRel = new SeekRelationship([a, b], this)
                        //     this.addRelationship(seekRel)
                        // }

                        if (type == "chain") {
                            const chainRel = new ChainRelationship([a, b], this)
                            this.addRelationship(chainRel)
                        }

                        // if (type == "orbit") {
                        //     const orbitRel = new OrbitRelationship([a, b], this)
                        //     this.addRelationship(orbitRel)
                        // }
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

    removeFromOpen(relationship: Relationship) {
        const index = this.openRelationships.indexOf(relationship)
        this.openRelationships.splice(index, 1)
    }

    addRelationship(relationship: Relationship) {
        this.relationships.add(relationship)

        if (relationship.open)
            this.openRelationships.push(relationship)
    }

    removeRelationship(relationship: Relationship) {
        this.relationships.delete(relationship)
        this.removeFromOpen(relationship)
    }

    runOpenRelationships() {
        if(this.openRelationships.length == 0)
            return

        const arr = Array.from(this.openRelationships)

        const rel: Relationship = randomFromArr(arr)
        console.log(rel)
        rel.lookForLove()

        console.log("interval called!")
        this.intervalActive = false
        // for (const r of this.openRelationships) {
        //     r.lookForLove()
        // }
    }

    update = () => {

        for (const baby of this.babies) {
            baby.run();
        }

        for (const adult of this.adults) {
            adult.run();
        }

        if(!this.intervalActive) {
            this.intervalActive = true
            setTimeout(() => {
                this.runOpenRelationships()
            }, seekInterval)
        }

        for (const r of this.relationships) {
            r.run()
        }

        paper.view.requestUpdate()
        requestAnimationFrame(this.update)
    }
}
