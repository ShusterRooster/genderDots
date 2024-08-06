import paper from "paper";
import {constrain} from "./HelperFunctions";
import {enableDebugTools} from "./debug/DebugTools";
import ShapeManager from "./ShapeManager";
import {testingMode} from "../Settings";
import {startTesting} from "./debug/TestMain";

/**
 * Calculates scale of the screen compared to a width of 2000px.
 * Scale is from 0.1 - 1.
 */
function calcScale() {
    const maxRes = 2000
    return constrain(window.innerWidth / maxRes, 0.1, 1)
}

// @ts-ignore
window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)

    const width = window.innerWidth
    console.log(width)

    let scale = calcScale()

    paper.view.onResize = function () {
        paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
        paper.view.scale(1 / scale)
        paper.view.scale(calcScale())
        scale = calcScale()
    }

    if(!testingMode) {
        const shapeManager = new ShapeManager(30)

        paper.view.onFrame = function () {
            shapeManager.update()
        }

        enableDebugTools(shapeManager)
    }
    else {
        startTesting()
    }
}