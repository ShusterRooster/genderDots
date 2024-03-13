import DotManager from "./DotManager.js";
import * as paper from 'paper';
window.onload = function () {
    // Get a reference to the canvas object
    const canvas = document.getElementById('dotsCanvas');
    const dotInfo = document.getElementById("dotInfo");
    // Create an empty project and a view for the canvas:
    // @src-ignore
    paper.setup(canvas);
    const dotManager = new DotManager(50);
    paper.view.update();
    console.log(paper.project.activeLayer.children);
    paper.view.onFrame = function (event) {
        dotManager.update();
    };
    canvas.addEventListener("mousemove", (e) => {
        dotInfo.innerHTML = `x: ${e.clientX}<br>y: ${e.clientY}`;
        dotInfo.style.top = e.clientY + "px";
        dotInfo.style.left = (e.clientX + 20) + "px";
    });
};
