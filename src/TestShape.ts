import BabyShape, {babyShape} from "./BabyShape";
import AdultShape from "./AdultShape";
import paper from "paper";
import PathArray from "./PathArray";
import {delay, map, testDot} from "./HelperFunctions";
import {maxSeekSpeed, maxVector} from "../Settings";

export default class TestShape extends AdultShape {

    cursorPoint = new paper.Point(0, 0)
    cursorMark: paper.Path

    lineArr = new PathArray("line")

    prevVelocity = new paper.Point(0, 0)
    init = false
    running = true

    piv: paper.Path
    pos: paper.Path
    circ: paper.Path

    constructor(inter: babyShape) {
        const baby = new BabyShape(inter)
        baby.distance = 0
        baby.genitalHeight = baby.genitalEndHeight
        baby.genGenitalia(baby.genitalEndHeight)
        super(baby);
        baby.shape.remove()

        this.teleport = false
        this.piv = testDot(this.pivot)
        this.pos = testDot(this.position, 3, "red")
        this.circ = new paper.Path.Circle({
          center: this.pivot,
          radius: this.radius,
          strokeColor: 'blue',
          strokeWidth: 2
        })

        this.cursorMark = testDot(this.cursorPoint, 10, "red")

        this.vector = new paper.Point({
            length: maxVector,
            angle: 0
        })
    }

    run() {
        this.prevVelocity = this.velocity

        if(this.running)
            super.run()

        this.pos.position = this.position
        this.piv.position = this.pivot
        this.circ.position = this.pivot

        this.testOOB()

        // this.seekPoint(this.cursorPoint)
    }

    testOOB() {
        if(this.outOfBounds()) {
            console.log("out of bounds!!")
            paper.view.pause()
        }
    }

    testOOBTime() {
        if (this.velocity.equals(this.prevVelocity) && !this.init) {
            console.log(`velocity stable!:`, this.velocity)

            let right= paper.view.bounds.rightCenter
            right.x -= (this.boundsHeight / 2)
            this.position = right

            this.init = true
            this.checkOOB(performance.now()).then((val) => {
                console.log(`REAL:`, val)

                const realTime = this.timeTillOOB(false)
                const estTime = this.timeTillOOB(true)

                console.log(`real vel:`, realTime)
                console.log(`stable vel:`, estTime)
                this.running = false
            })
        }
    }

    checkOOB(start: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            const right = paper.view.bounds.rightCenter
            const desired = right.add(new paper.Point(this.boundsHeight, 0))
            const dist = desired.subtract(this.position).length

            console.log("dist:", dist)
            if(dist < 2) {
                resolve(performance.now() - start)
                console.warn("it's done!!!")
            } else {
                await delay(0)
                this.checkOOB(start).then(resolve, reject)
            }
        });
    }

    seekPoint(point = this.cursorPoint) {
        this.cursorPoint = point
        this.cursorMark.position = point
        this.mouseTest()

        if (this.outOfBounds())
            return

        let desired = point.subtract(this.position)
        const d = desired.length;

        if (d < this.size) {
            desired.length = map(d, 0, this.size, 0, maxSeekSpeed);
        } else {
            desired.length = maxSeekSpeed
        }

        const steer = desired.subtract(this.velocity);
        this.applyForce(steer);
        this.pointTowards(desired.angle);
    }

    mouseTest() {
        const diff = this.cursorPoint.subtract(this.position)
        const line = new paper.Path.Line({
            from: this.position,
            to: this.cursorPoint,
            strokeColor: "red",
            strokeWidth: 3
        })

        this.pointTowards(diff.angle)
        this.lineArr.push(line)
    }

    setCursor(x: number, y: number) {
        this.cursorPoint = new paper.Point(x, y)
    }

}