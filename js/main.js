import DotManager from "./DotManager.js";

window.onload = function () {
    // Get a reference to the canvas object
    const canvas = document.getElementById('dotsCanvas')
    const ctx = canvas.getContext('2d')
    const dotInfo = document.getElementById("dotInfo")

    // Create an empty project and a view for the canvas:
    paper.setup(canvas)

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Attach canvas and ctx to the global object
    window.dotsCanvas = canvas
    window.dotsCtx = ctx

    window.dotsCanvas.width = window.innerWidth
    window.dotsCanvas.height = window.innerHeight

    const dotManager = new DotManager(50)

    paper.view.update()
    console.log(paper.project.activeLayer.children)

    paper.view.onFrame = function (event) {
        dotManager.update()
    }

    dotsCanvas.addEventListener("mousemove", (e) => {
        dotInfo.innerHTML = `x: ${e.clientX}<br>y: ${e.clientY}`
        dotInfo.style.top = e.clientY + "px"
        dotInfo.style.left = (e.clientX + 20) + "px"
    })
}






