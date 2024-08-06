import paper from "paper";
import {constrain} from "./HelperFunctions";
import {enableDebugTools} from "./debug/DebugTools";
import ShapeManager from "./ShapeManager";
import {adjustSettings, debugMode, testingMode} from "../Settings";
import {startTesting} from "./debug/TestMain";

const search = document.getElementById("search") as HTMLDivElement
search.style.display = "none"

/**
 * Calculates scale of the screen compared to a width of 2000px.
 * Scale is from 0.1 - 1.
 */
function calcScale() {
    const maxRes = 2000
    return constrain(window.innerWidth / maxRes, 0.1, 1)
}

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)
    adjustSettings(calcScale() * 2)

    if(!testingMode) {
        const shapeManager = new ShapeManager(30)

        paper.view.onFrame = function () {
            shapeManager.update()
        }

        if(debugMode)
            enableDebugTools(shapeManager)
    }
    else {
        startTesting()
    }
}