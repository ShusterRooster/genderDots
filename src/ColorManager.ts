import {random} from "./HelperFunctions";
import GenderShape from "./shapeClasses";
import paper from "paper";

export default class ColorManager {
    static readonly attractionTypes: string[] = ["similar", "diff", "random"]
    static readonly saturation: number = 0.1
    static readonly brightness: number = 1

    static readonly strokeWidth: number = 5
    static readonly minShadowBlur: number = 10
    static readonly maxShadowBlur: number = 25

    tolerance = random(10, 92)
    changeRate = random(0.5, 1.25)
    partners = []
    attractionType = ColorManager.attractionTypes[Math.floor(Math.random() * ColorManager.attractionTypes.length)]

    protected _innerColor: paper.Color
    protected _outerColor: paper.Color
    protected colorArr: paper.Color[] = []

    genderDot: GenderShape
    shadowBlur = random(ColorManager.minShadowBlur, ColorManager.maxShadowBlur)

    constructor(genderDot: GenderShape,
                innerColor?: paper.Color,
                outerColor?: paper.Color) {

        this.genderDot = genderDot
        this._innerColor = !innerColor ? this.generateColor(
            random(0, 360),
            ColorManager.saturation,
            ColorManager.brightness): innerColor

        this._outerColor = !outerColor ? this.generateColor(random(0, 360),
            ColorManager.saturation,
            ColorManager.brightness): outerColor
        this.colorArr.push(this._innerColor, this._outerColor)
    }

    generateColor(hue: number, saturation: number, brightness: number) {
        return new paper.Color({
            hue: hue,
            saturation: saturation,
            brightness: brightness
        })
    }

    get innerColor() {
        return this._innerColor
    }

    set innerColor(color) {
        this._innerColor = color
    }

    get outerColor() {
        return this._outerColor
    }

    set outerColor(color) {
        this._outerColor = color
    }

    colorDistance(other: GenderShape) {
        return ColorManager.colorDistance(this.outerColor, other.outerColor)
    }

    protected static distance(color: paper.Color) {
        return Math.sqrt((color.red ** 2) + (color.green ** 2) + (color.blue ** 2))
    }

    //finds color distance between two colors
    static colorDistance(color1: paper.Color, color2: paper.Color) {
        const color = color2.subtract(color1)
        return ColorManager.distance(color)
    }

    static numToColor(num: number) {
        return new paper.Color(num, num, num)
    }
}