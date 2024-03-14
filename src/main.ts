import paper from "paper";
import DotManager from "./DotManager";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    const dotInfo = document.getElementById("dotInfo")

    paper.setup(canvas)

    const dotManager = new DotManager(50)

    paper.view.update()
    console.log(paper.project.activeLayer.children)

    paper.view.onFrame = function () {
        dotManager.update()
    }

    if (canvas && dotInfo) {
        canvas.addEventListener("mousemove", (e) => {
            dotInfo.innerHTML = `x: ${e.clientX}<br>y: ${e.clientY}`
            dotInfo.style.top = e.clientY + "px"
            dotInfo.style.left = (e.clientX + 20) + "px"
        })
    }
}