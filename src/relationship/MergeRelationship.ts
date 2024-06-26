import Relationship from "./Relationship";
import AdultShape from "../AdultShape";
import BabyShape, {babyShape} from "../BabyShape";
import ShapeManager from "../ShapeManager";
import paper from "paper";
import {delay, randomFromArr} from "../HelperFunctions";
import {orbitSeekDelay} from "../../Settings";

export default class MergeRelationship extends Relationship {

    genitalWidth = 0
    genitalHeight = 0
    baby?: BabyShape
    adult?: AdultShape
    leader: AdultShape
    activePartners: AdultShape[] = []

    constructor(partners: AdultShape[], shapeManager: ShapeManager) {
        super(partners, shapeManager)
        this.averageGenitals()

        this.leader = this.findLeader()
    }

    averageColor() {
        let sumR = 0
        let sumG = 0
        let sumB = 0

        for (const shape of this.partners) {
            sumR += shape.color.red
            sumG += shape.color.green
            sumB += shape.color.blue
        }

        const parts = this.partners.size
        sumR /= parts
        sumG /= parts
        sumB /= parts

        return new paper.Color(sumR, sumG, sumB)
    }

    calcRadius() {
        let sumR = 0

        for (const shape of this.partners) {
            sumR += shape.radius
        }

        sumR /= this.partners.size
        return sumR *= 1.75
    }

    averageGenitals() {
        let sumGW = 0
        let sumGH = 0

        for (const shape of this.partners) {
            sumGW += shape.genitalWidth
            sumGH += shape.genitalHeight
        }

        const parts = this.partners.size
        sumGW /= parts
        sumGH /= parts

        this.genitalWidth = sumGW
        this.genitalHeight = sumGH
    }

    applyRelationshipStart(shape: AdultShape) {
        super.applyRelationshipStart(shape);

        if(shape == this.leader) {
            return
        }

        this.insideLeader(shape).then(() => {
            this.merge()
        })
    }

    findLeader(avoid?: AdultShape) {
        let rand: AdultShape;

        do {
            rand = randomFromArr(Array.from(this.partners));
        } while (rand === avoid);

        return rand;
    }

    insideLeader(shape: AdultShape) {
        return new Promise(async (resolve) => {
            if (this.leader.shape.contains(shape.position)) {
                await delay(orbitSeekDelay)
                resolve(true);
            } else {
                shape.seek(this.leader)
                await delay(orbitSeekDelay)
                this.insideLeader(shape).then(resolve)
            }
        });
    }

    merge() {
        this.hideAll()
        this.makeShape()
        this.growBaby()
    }

    hide(shape: AdultShape) {
        shape.shape.visible = false
    }

    hideAll() {
        for (const shape of this.partners) {
            this.hide(shape)
        }
    }

    show(shape: AdultShape) {
        shape.shape.visible = true
    }

    showAll() {
        for (const shape of this.partners) {
            this.show(shape)
        }
    }

    growBaby() {
        if (!this.baby!.doneGrowing) {
            this.baby!.growGenitalia()
            setTimeout(() => {
                this.growBaby()
            }, 100)
        } else {
            this.adult = new AdultShape(this.baby!)
        }
    }

    run() {

    }

    getColorArr() {
        const arr: paper.Color[] = []

        for (const partner of this.partners) {
            arr.push(partner.color)
        }

        return arr
    }

    makeShape() {
        const inter: babyShape = {
            shapeManager: this.shapeManager,
            spawnPoint: this.leader.position,
            radius: this.calcRadius(),
            distance: 0,
            genitalWidth: this.genitalWidth,
            genitalEndHeight: this.genitalHeight,
            color: this.averageColor()
        }

        this.baby = new BabyShape(inter)
        const origin = this.baby.shape.bounds.point.subtract(this.baby.genitalEndHeight)
        const destination = this.baby.shape.bounds.bottomRight.add(this.baby.genitalEndHeight)

        this.baby.shape.fillColor = {
            gradient: {
                stops: this.getColorArr(),
            },
            origin: origin,
            destination: destination
        }
    }
}