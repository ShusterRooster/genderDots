import {map, random, randomFromArr, setValueIfNull} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import paper from "paper";
import DotManager from "./DotManager";
import {aborted} from "node:util";

export default class ColorManager {
    static readonly minShadowBlur: number = 25
    static readonly maxShadowBlur: number = 50
    static readonly minGray: number = 0.32

    protected _color: paper.Color
    genderDot: GenderShape

    constructor(genderDot: GenderShape, color?: paper.Color) {
        this.genderDot = genderDot
        this._color = setValueIfNull(color, this.generateColor(Math.random()))
    }

    applyVisibility(item: paper.Path | paper.PathItem = this.genderDot.shape) {
        item.strokeColor = this.color
        item.shadowColor = this.color
        item.strokeWidth = 5

        item.strokeColor.alpha = this.calcAlpha()
        item.shadowBlur = this.calcShadow()
        item.shadowOffset = new paper.Point(0, 0)
    }

    generateColor(gray = random(0, ColorManager.minGray)) {
        return new paper.Color(gray)
    }

    calcShadow() {
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
        this.applyVisibility(this.genderDot.shape)
    }
}