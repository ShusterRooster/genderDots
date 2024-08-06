import TestShape from "../TestShape";
import paper from "paper";

export function startTesting() {
    const rotation = 90
    const sex = "male"
    const genWidth = 100

    const test = new TestShape({
        spawnPoint: paper.view.center,
        rotation: rotation,
        sex: sex,
        strokeWidth: 1,
        genitalWidth: genWidth,
        genitalEndHeight: 25
    })

    paper.view.onFrame = function () {
        test.run()
    }

    window.onmousemove = function (e: MouseEvent) {
        test.setCursor(e.clientX, e.clientY)
    }

    let moving = true

    document.addEventListener('keydown', function (e) {
        if (e.shiftKey) {
            if (moving)
                paper.view.pause()
            else
                paper.view.play()

            moving = !moving
        }

    })
}

