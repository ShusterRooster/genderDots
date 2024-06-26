import BabyShape, {babyShape} from "./BabyShape";
import AdultShape from "./AdultShape";
import paper from "paper";
import PathArray from "./PathArray";

export default class TestShape extends AdultShape {

    cursorX= 0
    cursorY= 0
    lineArr = new PathArray("line")

    constructor(inter: babyShape) {
        const baby = new BabyShape(inter)
        baby.distance = 0
        baby.genitalHeight = baby.genitalEndHeight
        baby.genGenitalia(baby.genitalEndHeight)

        super(baby);
        baby.shape.remove()
    }

    mouseTest(x = this.cursorX, y = this.cursorY) {
        this.cursorX = x
        this.cursorY = y

        const point = new paper.Point(x, y);
        const diff = point.subtract(this.position)
        const line = new paper.Path.Line({
            from: this.position,
            to: point,
            strokeColor: "red",
            strokeWidth: 3
        })

        this.pointTowards(diff.angle)
        console.log(`rot:`, this.shape.rotation)
        console.log(`diff:`, diff.angle)

        this.lineArr.push(line)
    }

}