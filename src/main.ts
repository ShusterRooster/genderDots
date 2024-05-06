import paper from "paper";
import ShapeManager from "./ShapeManager";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)

    let numWanted = 20
    const width = paper.view.viewSize.width

    // if(width >= 900) numWanted = 40
    // else if (width <= 991) numWanted = 25
    // else if (width <= 767) numWanted = 20
    // else if (width <= 479) numWanted = 15

    const shapeManager = new ShapeManager(numWanted)

    paper.view.onFrame = function () {
        shapeManager.update()
    }

    paper.view.onResize = function () {
        paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
    }


}