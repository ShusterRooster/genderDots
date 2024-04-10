import paper from "paper";
import DotManager from "./DotManager";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    paper.setup(canvas)

    const dotManager = new DotManager(35)

    paper.view.onFrame = function () {
        dotManager.update()
    }
}