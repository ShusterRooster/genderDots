import AdultShape from "../AdultShape";
import Chain from "./Chain";
import Relationship from "./Relationship";
import ShapeManager from "../ShapeManager";

export default class ChainRelationship extends Relationship {
    chainSet = new Set<Chain>()

    constructor(partners: AdultShape[], shapeManager: ShapeManager) {
        super(partners, shapeManager)

        this.applyStartRelationshipAll()
        this.genChains()
    }

    run() {
        for (const chain of this.chainSet) {
            chain.run()
        }
    }

    genChains() {
        this.removeAll()

        if(this.partners.size == 1)
            return

        const arr: AdultShape[] = Array.from(this.partners)

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i];

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j];

                const chain = new Chain(a, b)
                this.chainSet.add(chain)
            }
        }
    }

    info() {
        return `${super.info()}<br>chains: ${this.chainSet.size}`
    }

    removeAll() {
        for (const chain of this.chainSet) {
            chain.remove()
        }

        this.chainSet.clear()
    }

    addPartnerAction(partner: AdultShape) {
        this.genChains()
    }

    removePartnerAction(partner: AdultShape) {
        this.genChains()
    }

    endRelationship() {
        super.endRelationship();
        this.removeAll()
    }
}