import GenderShape from "./shapeClasses";
export default class ColorManager {
    static readonly attractionTypes: string[];
    static readonly saturation: number;
    static readonly brightness: number;
    static readonly strokeWidth: number;
    static readonly minShadowBlur: number;
    static readonly maxShadowBlur: number;
    tolerance: number;
    changeRate: number;
    partners: never[];
    attractionType: string;
    protected _innerColor: paper.Color;
    protected _outerColor: paper.Color;
    protected colorArr: paper.Color[];
    genderDot: GenderShape;
    shadowBlur: number;
    constructor(genderDot: GenderShape, innerColor?: paper.Color, outerColor?: paper.Color);
    generateColor(hue: number, saturation: number, brightness: number): paper.Color;
    get innerColor(): paper.Color;
    set innerColor(color: paper.Color);
    get outerColor(): paper.Color;
    set outerColor(color: paper.Color);
    colorDistance(other: GenderShape): number;
    protected static distance(color: paper.Color): number;
    static colorDistance(color1: paper.Color, color2: paper.Color): number;
    static numToColor(num: number): paper.Color;
}
