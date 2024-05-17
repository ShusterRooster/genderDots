import paper from "paper";
import ShapeManager from "./ShapeManager";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)
    // paper.view.autoUpdate = false

    let numWanted = 0
    const width = window.innerWidth

    // const text = new paper.PointText({
    //     point: [50, 50],
    //     fillColor: "white",
    //     fontSize: 25
    // })

    if(width >= 900) numWanted = 40
    else if (width <= 991) numWanted = 25
    else if (width <= 767) numWanted = 20
    else if (width <= 479) numWanted = 15

    const shapeManager = new ShapeManager(numWanted)
    shapeManager.update()

    // paper.view.onFrame = function (event: {count: any, time: any; delta: any; }) {
    //     text.content = `FPS: ${event.count / event.time}\ndelta: ${event.delta}`
    // }

    paper.view.onResize = function () {
        paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
    }


}