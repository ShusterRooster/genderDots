import paper from "paper";
import {constrain, limit, map} from "./HelperFunctions";
import {enableDebugTools} from "./debug/DebugTools";
import ShapeManager from "./ShapeManager";
import {debugMode, maxShapes, minShapes, testingMode} from "../Settings";
import {startTesting} from "./debug/TestMain";

const search = document.getElementById("search") as HTMLDivElement
search.style.display = "none"

/**
 * Calculates scale of the screen compared to a width of 2000px.
 * Scale is from 0.1 - 1.
 */
function calcScale() {
    const maxRes = 1080
    const div = window.innerWidth / maxRes
    return constrain(div * 1.5, 0.1, 1)
}

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)

    let scale = calcScale()
    paper.view.scale(scale)

    const standard = 1920 * 1080
    let current = paper.view.bounds.area

    paper.view.onResize = () => {
        const diff = Math.abs(current - paper.view.bounds.area) / 100

        if(diff > 25) {
            console.log("resized!!")
            paper.view.scale(1 / scale)
            scale = calcScale()
            paper.view.scale(scale)
        }

        current = paper.view.bounds.area
    }

    if(!testingMode) {
        const ratio = limit(current / standard, 1)
        let numWanted = Math.floor(map(ratio, 0.3, 1, minShapes, maxShapes))
        console.log("ratio", ratio)
        console.log("numWanted", numWanted)

        const shapeManager = new ShapeManager(numWanted)

        paper.view.onFrame = (event: {delta: number, time: number}) => {
            shapeManager.update()
        }

        if(debugMode)
            enableDebugTools(shapeManager)
    }
    else {
        startTesting()
    }
}