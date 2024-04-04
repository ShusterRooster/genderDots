import paper from "paper";
import ColorManager from "./ColorManager";
import GenderShape, {genderShape} from "./shapeClasses";
import DotManager from "./DotManager";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const dotInfo = document.getElementById("dotInfo") as HTMLElement
    paper.setup(canvas)

    let frameRate = new paper.PointText(new paper.Point(20, 30))
    //@ts-ignore
    frameRate.fillColor = 'white'
    frameRate.fontSize = 20

    // const view = paper.view.viewSize
    // const testInter: genderShape = {distance: 0, radius: 50, genitalWidth: 25, genitalEndHeight: 25}

    const dotManager = new DotManager(25)



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