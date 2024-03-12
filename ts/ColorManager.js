export default class ColorManager {
    static attractionTypes = ["similar", "diff", "random"]
    static saturation = 0.1
    static brightness = 1

    static strokeWidth = 5
    static minShadowBlur = 10
    static maxShadowBlur = 25

    #inner
    #outer
    #colorArr = []

    tolerance = random(10, 92)
    changeRate = random(0.5, 1.25)
    partners = []
    attractionType = ColorManager.attractionTypes[Math.floor(Math.random() * ColorManager.attractionTypes.length)]

    constructor(genderDot, innerColor, outerColor, saturation, brightness, strokeWidth, shadowBlur) {
        this.genderDot = genderDot
        ColorManager.saturation = saturation || ColorManager.saturation
        ColorManager.brightness = brightness || ColorManager.brightness

        this.#inner = innerColor || this.generateColor(random(0, 360), ColorManager.saturation, ColorManager.brightness)
        this.#outer = outerColor || this.generateColor(random(0, 360), ColorManager.saturation, ColorManager.brightness)
        this.#colorArr.push(this.#inner, this.#outer)

        this.strokeWidth = strokeWidth || ColorManager.strokeWidth
        this.shadowBlur = shadowBlur || random(ColorManager.minShadowBlur, ColorManager.maxShadowBlur)
    }

    generateColor(hue, saturation, brightness) {
        return new paper.Color({
            hue: hue,
            saturation: saturation,
            brightness: brightness
        })
    }

    set saturation(saturation) {
        ColorManager.saturation = saturation

        for (let i = 0; i < this.#colorArr.length; i++) {
            this.#colorArr[i].saturation = saturation
        }
    }

    set brightness(brightness) {
        ColorManager.brightness = brightness

        for (let i = 0; i < this.#colorArr.length; i++) {
            this.#colorArr[i].brightness = brightness
        }
    }

    get innerColor() {
        return this.#inner
    }

    set innerColor(color) {
        this.#inner = color
    }

    get outerColor() {
        return this.#outer
    }

    set outerColor(color) {
        this.#outer = color
    }

    colorDistance(other) {
        return ColorManager.colorDistance(this.outerColor, other.outerColor)
    }

    static #distance(red, green, blue) {
        return Math.sqrt((red ** 2) + (green ** 2) + (blue ** 2))
    }

    //finds color distance between two colors
    static colorDistance(color1, color2) {
        const color = color2.subtract(color1)
        return this.#distance(color.red, color.green, color.blue)
    }

    static numToColor(num) {
        return new paper.Color(num, num, num)
    }
}