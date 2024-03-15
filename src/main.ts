import paper from "paper";
import DotManager from "./DotManager";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    const dotInfo = document.getElementById("dotInfo") as HTMLElement
    paper.setup(canvas)

    let frameRate = new paper.PointText(new paper.Point(20, 30))
    //@ts-ignore
    frameRate.fillColor = 'white'
    frameRate.fontSize = 20

    const dotManager = new DotManager(50)

    paper.view.onFrame = function (event: { count: number; delta: number; }) {
        frameRate.content = `FPS: ${(event.count / event.delta)/60}`
        dotManager.update()
    }

    console.log(paper.project.activeLayer.children)

    canvas.addEventListener("mousemove", (e) => {
        dotInfo.innerHTML = `x: ${e.clientX}<br>y: ${e.clientY}`
        dotInfo.style.top = e.clientY + "px"
        dotInfo.style.left = (e.clientX + 20) + "px"
    })
}