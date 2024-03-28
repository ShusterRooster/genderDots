import GenderShape from "./shapeClasses";
import paper from "paper";
import {PathArray, random, randomFromArr, setValueIfNull} from "./HelperFunctions";
import DotManager from "./DotManager";

export class Relationship {
    static readonly attractionTypes: string[] = ["similar", "diff", "random"]
    static readonly relationshipTypes: string[] = ["seek", "orbit", "chain", "merge"]
    static readonly maxPartners: number = 6

    static readonly chainThickness: number = 8
    // static readonly minChainLength: number = DotManager.minRadius * 1.50
    // static readonly maxChainLength: number = DotManager.maxRadius * 1.50

    partners: GenderShape[]
    maxPartners = Math.max(random(2, Relationship.maxPartners))

    attractor: GenderShape | undefined
    orbitCircle: paper.Path.Circle | undefined

    chainArr: PathArray | undefined

    color: paper.Color
    attractionType: string

    relationshipType = randomFromArr(Relationship.relationshipTypes)
    partnersReady = false

    constructor(partners: GenderShape[], attractionType: string, color?: paper.Color) {
        this.partners = partners
        this.attractionType = attractionType

        this.color = setValueIfNull(color, paper.Color.random())
    }

    static pairShapes(arr: GenderShape[]) {
        //see if other is within parameters then see if our color is within other's params
        arr = arr.filter((obj) => !obj.isLoner)

        for (let i = 0; i < arr.length; i++) {
            const a = arr[i]

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j]

                if ((a.attractedTo(b) && b.attractedTo(a)) &&
                    (typeof a.relationship == undefined && typeof b.relationship == undefined)) {
                    new Relationship([a, b], a.attractionType)
                }
            }

        }
    }

    run() {
        if (this.allPartnersReady()) {
            this.applyRelationshipAll()

            if (this.relationshipType == "seek")
                this.seek()

            else if (this.relationshipType == "orbit")
                this.orbit()

            else if (this.relationshipType == "chain")
                this.drawChains()

            else if (this.relationshipType == "chain")
                this.merge()
        }
    }

    static mutual(a: GenderShape, b: GenderShape) {
        return a.attractedTo(b) && b.attractedTo(a)
    }

    static allMutual(arr: GenderShape[]) {
        for (let i = 0; i < arr.length; i++) {
            const a = arr[i]

            for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j]

                if (!this.mutual(a, b)) return false
            }
        }

        return true
    }

    static getAvgFromArr(objects: any[], attr: keyof any) {
        if (objects.length === 0) return 0; // Handle edge case where array is empty
        const total = objects.reduce((sum, obj) => sum + obj[attr], 0);
        return total / objects.length;
    }

    applyRelationshipAll(){
        for (const shape of this.partners) {
            this.applyRelationship(shape)
        }
    }

    applyRelationship(shape: GenderShape) {
        shape.relationship = this
        if (shape.ready) shape.colorManager.color = this.color
    }

    determineAttractor() {
        this.partners.sort((a, b) => b.endSize - a.endSize)
        return this.partners[0]
    }

    seek() {
        if (typeof this.attractor === undefined) {
            this.attractor = this.determineAttractor()
        }

        for (const shape of this.partners) {
            if (shape !== this.attractor && this.attractor) {
                shape.seek(this.attractor)
            }
        }
    }

    calcOrbit() {
        let pointTotal = new paper.Point(0, 0)
        let sizeTotal = 0


        for (const shape of this.partners) {
            pointTotal = pointTotal.add(shape.position)
            sizeTotal += shape.radius + shape.genitalEndHeight
        }

        pointTotal = pointTotal.divide(this.partners.length)
        sizeTotal /= this.partners.length

        this.orbitCircle = new paper.Path.Circle(pointTotal, sizeTotal)

        //@ts-ignore
        this.orbitCircle.strokeColor = "blue"
    }

    orbit() {
        if (typeof this.orbitCircle === undefined)
            this.calcOrbit()

        for (const shape of this.partners) {
            if (!this.orbitCircle!.intersects(shape.shape)) {
                shape.seek(this.orbitCircle!.position)
            } else {
                const offset = this.orbitCircle!.length / shape.radius
                const point = this.orbitCircle!.getPointAt(offset)

                shape.seek(point)
            }
        }
    }

    chainsNeeded() {
        return this.partners.length * (this.partners.length - 1)
    }

    drawChains() {
        if (typeof this.chainArr === undefined)
            this.chainArr = new PathArray("chainArr", this.chainsNeeded())

        for (let i = 0; i < this.partners.length; i++) {
            const a = this.partners[i].position

            for (let j = i + 1; j < this.partners.length; j++) {
                const b = this.partners[j].position

                const line = new paper.Path.Line({
                    from: a,
                    to: b,
                    strokeColor: this.color,
                    strokeWidth: Relationship.chainThickness
                })

                this.chainArr?.push(line)
            }

        }
    }
    
    getCombinedSex(){
        const arr = this.partners
        const allEqual = arr.every(val => val.sex === arr[0].sex);

        if (allEqual)
            return arr[0].sex
        else
            return "intersex"
    }
    
    getAvgColor(){
        let totalColor: paper.Color | undefined
        
        for (let i = 0; i < this.partners.length - 1; i++) {
            const obj = this.partners[i].colorManager.color
            const next = this.partners[i + 1].colorManager.color
            const curAvg = obj.add(next).divide(2)
            
            if(typeof totalColor == undefined)
                totalColor = curAvg
            else
               totalColor = totalColor!.add(curAvg).divide(i)
            
        }
        
        return totalColor!
    }

    mergeShape() {
        const avgRad = Relationship.getAvgFromArr(this.partners, 'radius')
        const avgHeight = Relationship.getAvgFromArr(this.partners, 'genitalEndHeight')
        const avgWidth = Relationship.getAvgFromArr(this.partners, 'genitalWidth')
        const avgColor = this.getAvgColor()
        const sex = this.getCombinedSex()
        
        const obj = this.partners[0]

        for (const shape of this.partners) {
            shape.dotManager?.remove(shape)
        }

        const newShape = new GenderShape({dotManager: obj.dotManager, 
            spawnPoint: obj.position, radius: avgRad, distance: 0, sex: sex,
            genitalWidth: avgWidth, genitalEndHeight: avgHeight, color: avgColor})

        obj.dotManager?.arr.push(newShape)
    }

    merge() {
        this.seek()

        for (const shape of this.partners) {
            if (shape !== this.attractor && this.attractor) {
                if (this.attractor?.shape.contains(shape)) {
                    this.mergeShape()
                }
            }
        }
    }

    allPartnersReady() {
        if (this.partners.length > 1) {
            for (const shape of this.partners) {
                if (!shape.ready) return false
            }
        }

        return true
    }

    addPartner(partner: GenderShape) {
        const arr = this.partners
        arr.push(partner)

        if (Relationship.allMutual(arr) && this.partners.length < this.maxPartners) {
            this.partners.push(partner)
            partner.colorManager.color = this.color
        }
    }
}