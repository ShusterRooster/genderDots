import Relationship from "./relationship/Relationship";
import {createInstance, randomFromArr} from "./HelperFunctions";
import {seekInterval} from "../Settings";
import BabyShape from "./BabyShape";
import AdultShape from "./AdultShape";
import SeekRelationship from "./relationship/SeekRelationship";
import ChainRelationship from "./relationship/ChainRelationship";

/**
 * @classdesc Manages all relationships and shapes for a given instance.
 */
export default class ShapeManager {

    /**
     * Types of relationships to run in the program. Not in Settings because of initialization errors.
     */
    static relationshipTypes: typeof Relationship[] = [
        SeekRelationship,
        ChainRelationship,
        // OrbitRelationship
    ];

    babies = new Set<BabyShape>()
    adults = new Set<AdultShape>()
    relationships = new Set<Relationship>()

    /**
     * Keeps track of open relationships for relationship seeking.
     */
    openRelationships: Relationship[] = []

    /**
     * Time since runOpenRelationships has been run.
     */
    lastCallTime = performance.now()

    /**
     * Amount of shapes desired by the user, configured in Settings.ts unless specified otherwise.
     */
    numWanted: number

    constructor(numWanted: number) {
        this.relationships = new Set();
        this.numWanted = numWanted;
        this.initDots();
    }

    /**
     * Creates numWanted BabyShapes so they can grow into AdultShapes
     */
    initDots() {
        for (let i = 0; i < this.numWanted!; i++) {
            const shape = new BabyShape({shapeManager: this});
            this.babies.add(shape)
        }
    }

    /**
     * Compares each AdultShape with another to check compatibility and creates relationships when valid.
     */
    initRelationships() {
        const arr = Array.from(this.adults)

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            if(a.isLoner) continue

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                if(b.isLoner) continue

                if (!(a.inRelationship || b.inRelationship) &&
                    !(a.pending || b.pending)) {
                    if (Relationship.mutual(a, b)) {
                        const rand = randomFromArr(ShapeManager.relationshipTypes)
                        const rel: Relationship = createInstance(rand, [a, b], this)
                        this.addRelationship(rel)
                    }
                }
            }
        }
    }


    /**
     * Called by an AdultShape when it is initialized.
     * The BabyShape is removed from this.babies and the AdultShape is added and run accordingly.
     * @param baby old BabyShape to be removed
     * @param adult new AdultShape to be initialized in the manager
     */
    babyToAdult(baby: BabyShape, adult: AdultShape) {
        this.babies.delete(baby)
        this.adults.add(adult)
        baby.shape.remove()
        this.initRelationships()
    }

    /**
     * Removes a given relationship instance from the openRelationships array.
     * @param relationship
     */
    removeFromOpen(relationship: Relationship) {
        const index = this.openRelationships.indexOf(relationship)
        this.openRelationships.splice(index, 1)
    }

    /**
     * Adds a given relationship to the manager and adds it to openRelationships if it is open.
     * @param relationship
     */
    addRelationship(relationship: Relationship) {
        this.relationships.add(relationship)

        if (relationship.open)
            this.openRelationships.push(relationship)
    }

    /**
     * Removes a given relationship from openRelationships and relationships.
     * If there are fewer relationships than specified in Settings, it will initialize more.
     * @param relationship
     */
    removeRelationship(relationship: Relationship) {
        this.relationships.delete(relationship)
        this.removeFromOpen(relationship)
    }


    /**
     * Finds a random relationship from this.relationships and will then call that relationship to look for more partners.
     */
    runOpenRelationships() {
        if (this.openRelationships.length == 0)
            return

        this.lastCallTime = performance.now()
        const rel: Relationship = randomFromArr(this.openRelationships)
        rel.lookForLove()
    }

    /**
     * Runs every frame to run all objects managed by the ShapeManager
     */
    update() {
        const curTime = performance.now()

        for (const baby of this.babies) {
            baby.run();
        }

        for (const adult of this.adults) {
            adult.run();
        }

        /**
         * If the last time an open relationship has run has been more than the specified time of seekInterval, it will run.
         */
        if (curTime - this.lastCallTime >= seekInterval) {
            this.runOpenRelationships()
        }

        for (const r of this.relationships) {
            r.run()
        }

        // console.log(paper.project.activeLayer.children)
    }
}
