import { random } from "./HelperFunctions";
import { Color } from "paper";
export default class ColorManager {
    static attractionTypes = ["similar", "diff", "random"];
    static saturation = 0.1;
    static brightness = 1;
    static strokeWidth = 5;
    static minShadowBlur = 10;
    static maxShadowBlur = 25;
    tolerance = random(10, 92);
    changeRate = random(0.5, 1.25);
    partners = [];
    attractionType = ColorManager.attractionTypes[Math.floor(Math.random() * ColorManager.attractionTypes.length)];
    _innerColor;
    _outerColor;
    colorArr;
    genderDot;
    shadowBlur = random(ColorManager.minShadowBlur, ColorManager.maxShadowBlur);
    constructor(genderDot, innerColor, outerColor) {
        this.genderDot = genderDot;
        this._innerColor = !innerColor ? this.generateColor(random(0, 360), ColorManager.saturation, ColorManager.brightness) : innerColor;
        this._outerColor = !outerColor ? this.generateColor(random(0, 360), ColorManager.saturation, ColorManager.brightness) : outerColor;
        this.colorArr.push(this._innerColor, this._outerColor);
    }
    generateColor(hue, saturation, brightness) {
        return new Color({
            hue: hue,
            saturation: saturation,
            brightness: brightness
        });
    }
    get innerColor() {
        return this._innerColor;
    }
    set innerColor(color) {
        this._innerColor = color;
    }
    get outerColor() {
        return this._outerColor;
    }
    set outerColor(color) {
        this._outerColor = color;
    }
    colorDistance(other) {
        return ColorManager.colorDistance(this.outerColor, other.outerColor);
    }
    static distance(color) {
        return Math.sqrt((color.red ** 2) + (color.green ** 2) + (color.blue ** 2));
    }
    //finds color distance between two colors
    static colorDistance(color1, color2) {
        const color = color2.subtract(color1);
        return ColorManager.distance(color);
    }
    static numToColor(num) {
        return new paper.Color(num, num, num);
    }
}
