import BabyShape, {babyShape} from "../BabyShape";
import AdultShape from "../AdultShape";
import paper from "paper";
import PathArray from "../PathArray";
import {constrain, constrainPoint, delay, map, nearestBounds, testDot, testLine} from "../HelperFunctions";
import {maxBoostVector, maxSeekSpeed, maxVector, minVector} from "../../Settings";

export default class TestShape extends AdultShape {

    cursorPoint = new paper.Point(0, 0)

    lineArr = new PathArray("line", 2)

    prevVelocity = new paper.Point(0, 0)
    init = false
    running = true

    constructor(inter: babyShape) {
        const baby = new BabyShape(inter)
        baby.distance = 0
        baby.genitalHeight = baby.genitalEndHeight
        baby.genGenitalia(baby.genitalEndHeight)
        super(baby);
        baby.shape.remove()
    }

    // seek(target: AdultShape) {
    //     let desired = target.pivot.subtract(this.pivot)
    //     const shapeBounds = nearestBounds(this.pivot).subtract(this.pivot)
    //     const targetBounds = nearestBounds(target.pivot)
    //     const targetDiff = targetBounds.subtract(target.pivot)
    //
    //     console.log(targetBounds)
    //
    //     const totalDist = shapeBounds.length + targetDiff.length + this.boundsHeight
    //
    //     // console.log(totalDist, desired.length / 4)
    //
    //     if (totalDist < desired.length / 4) {
    //         const end = endPoint(targetBounds, this.boundsHeight * 2, targetDiff.angle)
    //         const opp = centerOpposite(end)
    //         desired = opp.subtract(this.pivot)
    //
    //         this.lineArr.push(testDot(nearestBounds(centerOpposite(this.pivot)), 5))
    //         this.lineArr.push(testDot(nearestBounds(centerOpposite(target.pivot)), 5, "red"))
    //     }
    //
    //     this.lineArr.push(testLine(this.pivot, this.pivot.add(desired)))
    //
    //     if (this.boosting)
    //         desired.length = constrain(this.boostSpeed, minVector, maxBoostVector)
    //     else
    //         desired.length = constrain(desired.length, minVector, maxVector)
    //
    //
    //     let steer = desired.subtract(this.velocity)
    //     this.applyForce(steer);
    //     this.pointTowards(desired.angle)
    // }

    seek2(target: AdultShape) {
        let desired = target.pivot.subtract(this.pivot)

        const shapeBounds = nearestBounds(this.pivot)
        this.lineArr.push(testDot(shapeBounds[0], 5))
        this.lineArr.push(testDot(shapeBounds[1], 5))

        const newTarget = this.reflectedTarget(shapeBounds, target.pivot)

        if(newTarget) {
            const oobDist = newTarget.subtract(this.pivot)

            console.log("target", newTarget)
            console.log("oobDist:", oobDist.length)
            console.log("real:", desired.length)
            console.log()

            if (oobDist.length < desired.length) {
                this.lineArr.push(testLine(this.pivot, newTarget))
                desired = newTarget.subtract(this.pivot)
            }
        }

        desired.length = this.boosting ? constrain(this.boostSpeed, minVector, maxBoostVector) : maxVector

        let steer = desired.subtract(this.velocity)
        this.applyForce(steer);
        this.pointTowards(desired.angle)
    }

    reflectedTarget(shapeBounds: paper.Point[], target: paper.Point): paper.Point | undefined {
        const center = paper.view.center
        const bounds = paper.view.bounds

        const targetCenter = constrainPoint(
            target.subtract(center),
            -center.x, -center.y,
            center.x, center.y)

        const overflow = target.subtract(center).subtract(targetCenter)

        let oobDist = paper.view.center.multiply(2)
        let newTarget: paper.Point

        for (const b of shapeBounds) {
            const offset = new paper.Point(0, 0)
            const reflect = new paper.Point(1, 1)

            //if vertical, mirror y axis
            //if horizontal, mirror x axis
            if (b.y === bounds.bottom) {
                offset.y = bounds.height
                reflect.x = -1
            } else if (b.y === 0) {
                offset.y = -bounds.height
                reflect.x = -1
            }

            if (b.x === bounds.right) {
                offset.x = bounds.width
                reflect.y = -1
            } else if (b.x === 0) {
                offset.x = -bounds.width
                reflect.y = -1
            }

            const adjOver = overflow.multiply(new paper.Point(reflect.y, reflect.x))
            const newCenter = center.add(offset)
            const target = newCenter.add(targetCenter.multiply(reflect))
            const dist = target.subtract(this.pivot)

            if (dist.length < oobDist.length) {
                oobDist = dist
                newTarget = target.add(adjOver)
            }
        }

        //@ts-ignore
        return newTarget
    }

    testOOB() {
        if (this.outOfBounds()) {
            console.log("out of bounds!!")
            paper.view.pause()
        }
    }

    testOOBTime() {
        if (this.velocity.equals(this.prevVelocity) && !this.init) {
            console.log(`velocity stable!:`, this.velocity)

            let right = paper.view.bounds.rightCenter
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
            if (dist < 2) {
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