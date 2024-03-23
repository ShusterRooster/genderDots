import paper from "paper";
import DotManager, {TestShape} from "./DotManager";
import ColorManager from "./ColorManager";
import GenderShape from "./shapeClasses";
import {random} from "./HelperFunctions";
import {Quadtree} from "./QuadTree";

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const dotInfo = document.getElementById("dotInfo") as HTMLElement
    paper.setup(canvas)

    let frameRate = new paper.PointText(new paper.Point(20, 30))
    //@ts-ignore
    frameRate.fillColor = 'white'
    frameRate.fontSize = 20

    const view = paper.view.viewSize

    // Create a new Quadtree
    const tree = new Quadtree({
        width: view.width,
        height: view.height,
        maxObjects: 4,
    });


    const dotManager = new DotManager(35, tree)
    const testShape: TestShape = {spawnPoint: new paper.Point(500, 500), sex: "intersex", distance: 500}
    dotManager.createTestShape(testShape)


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