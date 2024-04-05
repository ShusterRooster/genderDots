import paper, {settings} from "paper";
import DotManager from "./DotManager";
import {map, random} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import {
    maxDistance,
    maxRadius,
    maxShadowBlur,
    maxThickness,
    minGray,
    minRadius,
    minShadowBlur,
    minThickness
} from "../Settings";

export default class ColorManager {
    relationshipColor: paper.Color | undefined
    protected _color: paper.Color
    genderDot: GenderShape

    strokeWidth = random(minThickness, maxThickness)

    constructor(genderDot: GenderShape, color?: paper.Color) {
        this.genderDot = genderDot
        this._color = color ?? this.generateColor(Math.random())
    }

    applyVisibility(item: paper.Path | paper.PathItem = this.genderDot.shape) {
        item.strokeColor = this.relationshipColor ?? this.color
        item.shadowColor = this.relationshipColor ?? this.color
        item.strokeWidth = this.strokeWidth

        item.strokeColor.alpha = this.calcAlpha()
        item.shadowBlur = this.calcShadow()
        item.shadowOffset = new paper.Point(0, 0)
    }

    generateColor(gray = random(0, minGray)) {
        return new paper.Color(gray)
    }

    calcShadow() {
        return map(this.genderDot.calcSize(),
            minRadius, maxRadius,
            minShadowBlur, maxShadowBlur)
    }

    calcAlpha(distance = this.genderDot.distance) {
        return map(distance, 0, maxDistance, 1, 0)
    }

    get color() {
        return this._color
    }

    get gray() {
        return this._color.gray
    }

    set color(color: paper.Color) {
        this.applyVisibility(this.genderDot.shape)
    }
}