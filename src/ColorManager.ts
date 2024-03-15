import {map, random} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import paper from "paper";
import DotManager from "./DotManager";

export default class ColorManager {
    static readonly attractionTypes: string[] = ["similar", "diff", "random"]
    static readonly minShadowBlur: number = 10
    static readonly maxShadowBlur: number = 25

    static readonly maxGray: number = 0.75

    tolerance = random(10, 92)
    changeRate = random(0.5, 1.25)
    partners = []
    attractionType = ColorManager.attractionTypes[Math.floor(Math.random() * ColorManager.attractionTypes.length)]

    protected _color: paper.Color
    genderDot: GenderShape

    constructor(genderDot: GenderShape, color?: paper.Color) {
        this.genderDot = genderDot
        this._color = !color ? this.generateColor(Math.random()): color
    }

    applyVisibility(item: paper.Path | paper.PathItem = this.genderDot.shape) {
        item.fillColor = this.color
        item.shadowColor = this.color

        item.fillColor.alpha = this.calcAlpha()
        item.shadowBlur = this.calcShadow()
        item.shadowOffset = new paper.Point(0, 0)
    }

    generateColor(gray = random(0, ColorManager.maxGray)) {
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

    colorDistance(other: GenderShape) {
        return ColorManager.colorDistance(this.color, other.color)
    }

    protected static distance(color: paper.Color) {
        return Math.sqrt((color.red ** 2) + (color.green ** 2) + (color.blue ** 2))
    }

    //finds color distance between two colors
    static colorDistance(color1: paper.Color, color2: paper.Color) {
        const color = color2.subtract(color1)
        return ColorManager.distance(color)
    }
}