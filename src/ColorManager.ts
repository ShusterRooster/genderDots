import paper from "paper";
import DotManager from "./DotManager";
import {Color, Dots, map, random} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import {settings} from "./HelperFunctions";

export default class ColorManager {
    relationshipColor: paper.Color | undefined
    protected _color: paper.Color
    genderDot: GenderShape

    constructor(genderDot: GenderShape, color?: paper.Color) {
        this.genderDot = genderDot
        this._color = color ?? this.generateColor(Math.random())
    }

    applyVisibility(item: paper.Path | paper.PathItem = this.genderDot.shape) {
        item.strokeColor = this.relationshipColor ?? this.color
        item.shadowColor = this.relationshipColor ?? this.color
        item.strokeWidth = 5

        item.strokeColor.alpha = this.calcAlpha()
        item.shadowBlur = this.calcShadow()
        item.shadowOffset = new paper.Point(0, 0)
    }

    generateColor(gray = random(0, Color.minGray)) {
        return new paper.Color(gray)
    }

    calcShadow() {
        return map(this.genderDot.calcSize(),
            Dots.minRadius, Dots.maxRadius,
            Color.minShadowBlur, Color.maxShadowBlur)
    }

    calcAlpha(distance = this.genderDot.distance) {
        return map(distance, 0, Dots.maxDistance, 1, 0)
    }

    get color() {
        return this._color
    }

    set color(color: paper.Color) {
        this.applyVisibility(this.genderDot.shape)
    }
}