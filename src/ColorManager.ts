import paper from "paper";
import {map, random} from "./HelperFunctions";
import {BabyShape} from "./shapeClasses";
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
    color: paper.Color
    babyShape: BabyShape
    strokeWidth = random(minThickness, maxThickness)

    constructor(baby: BabyShape, color?: paper.Color) {
        this.babyShape = baby
        this.color = color ?? paper.Color.random()
    }

    applyVisibility(item: paper.Path | paper.PathItem = this.babyShape.shape) {
        item.strokeColor = this.color
        item.shadowColor = this.color
        item.strokeWidth = this.strokeWidth

        item.strokeColor.alpha = this.calcAlpha()
        item.shadowBlur = this.calcShadow()
        item.shadowOffset = new paper.Point(0, 0)
    }

    static colorDistance(color: paper.Color, other: paper.Color) {
        const redDist = (color.red - other.red) ** 2
        const greenDist = (color.green - other.green) ** 2
        const blueDist = (color.blue - other.blue) ** 2

        return Math.sqrt(redDist + greenDist + blueDist)
    }

    static calcShadow(size: number) {
        return map(size, minRadius, maxRadius,
            minShadowBlur, maxShadowBlur)
    }

    generateGray(gray = random(0, minGray)) {
        return new paper.Color(gray)
    }

    calcShadow() {
        return map(this.babyShape.calcSize(),
            minRadius, maxRadius,
            minShadowBlur, maxShadowBlur)
    }

    calcAlpha(distance = this.babyShape.distance) {
        return map(distance, 0, maxDistance, 1, 0)
    }
}