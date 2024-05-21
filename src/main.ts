import paper from "paper";
import ShapeManager from "./ShapeManager";
import {constrain} from "./HelperFunctions";

function calcScale() {
    const maxRes = 2000
    return constrain(window.innerWidth / maxRes, 0.1, 1)
}

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)
    // paper.view.autoUpdate = false

    let numWanted = 40
    const width = window.innerWidth
    console.log(width)

    paper.view.scale(calcScale())

    const shapeManager = new ShapeManager(numWanted)
    shapeManager.update()

    paper.view.onResize = function () {
        paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
        paper.view.scale(calcScale())
    }

}