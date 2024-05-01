import paper from "paper";
import DotManager from "./DotManager";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)

    let numWanted = 0
    const width = paper.view.viewSize.width

    if(width >= 900) numWanted = 40
    else if (width <= 991) numWanted = 25
    else if (width <= 767) numWanted = 20
    else if (width <= 479) numWanted = 15

    const dotManager = new DotManager(numWanted)

    paper.view.onFrame = function () {
        dotManager.update()
    }

    paper.view.onResize = function () {
        paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
    }


}