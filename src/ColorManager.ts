import {map, random, randomFromArr} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import paper from "paper";
import DotManager from "./DotManager";

export default class ColorManager {
    // static readonly attractionTypes: string[] = ["similar", "diff", "random"]
    static readonly attractionTypes: string[] = ["similar"]

    static readonly minShadowBlur: number = 25
    static readonly maxShadowBlur: number = 50
    static readonly minGray: number = 0.32

    tolerance = random(0, 0.5)
    changeRate = random(0.5, 1.25)
    partners: GenderShape[] = []
    attractionType = randomFromArr(ColorManager.attractionTypes)

    protected _color: paper.Color
    genderDot: GenderShape

    constructor(genderDot: GenderShape, color?: paper.Color) {
        this.genderDot = genderDot
        this._color = !color ? this.generateColor(Math.random()): color
    }

    applyVisibility(item: paper.Path | paper.PathItem = this.genderDot.shape) {
        item.strokeColor = this.color
        item.shadowColor = this.color
        item.strokeWidth = 5

        item.strokeColor.alpha = this.calcAlpha()
        item.shadowBlur = this.calcShadow()
        item.shadowOffset = new paper.Point(0, 0)
    }

    calcAttraction(other: GenderShape){
        //see if other is within parameters then see if our color is within other's params


        switch(this.attractionType){

            case "similar": {
                const colorDiff = Math.abs(this.color.gray - other.color.gray)

                if(colorDiff <= this.tolerance){
                    console.log("relationship detected")
                    this.startAttraction(other)
                }


            }


        }





    }

    mutualPartner(other: GenderShape) {
        return other.colorManager.partners.includes(this.genderDot)
    }

    determineAttractor(){
        let partnerArr = this.partners
        partnerArr.push(this.genderDot)

        partnerArr.sort((a, b) => b.endSize - a.endSize)

        return partnerArr[0]
    }

    startAttraction(other: GenderShape){
        let attractor

        if(!this.partners.includes(other)){
            this.partners.push(other)

            attractor = this.determineAttractor()
        }

        if(this.mutualPartner(other)){
            for (const shape of this.partners) {
                // attractor!.attractShape(shape)
                shape.attractShape(other)
            }
        }



    }


    generateColor(gray = random(0, ColorManager.minGray)) {
        return new paper.Color(gray)
    }

    calcShadow(){
        return map(this.genderDot.calcSize(),
            DotManager.minRadius, DotManager.maxRadius,
            ColorManager.minShadowBlur, ColorManager.maxShadowBlur)
    }

    calcAlpha(distance = this.genderDot.distance) {
        return map(distance, 0, DotManager.maxDistance, 1, 0)
    }

    get color() {
        return this._color
    }

    set color(color: paper.Color) {
        this._color = color
        this.applyVisibility()
    }
}