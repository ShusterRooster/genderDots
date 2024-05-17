import paper from "paper";
import {map, random} from "./HelperFunctions";
import {
    maxDistance,
    maxThickness,
    minGray,
    minThickness
} from "../Settings";
import BabyShape from "./BabyShape";

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
    }

    static colorDistance(color: paper.Color, other: paper.Color) {
        const redDist = (other.red - color.red) ** 2
        const greenDist = (other.green - color.green) ** 2
        const blueDist = (other.blue - color.blue) ** 2

        return Math.sqrt(redDist + greenDist + blueDist) * 255
    }

    generateGray(gray = random(0, minGray)) {
        return new paper.Color(gray)
    }

    calcAlpha(distance = this.babyShape.distance) {
        return map(distance, 0, maxDistance, 1, 0)
    }
}