import paper from "paper";
import TestShape from "./TestShape";

export function startTesting() {
    const center = paper.view.center
    const bounds = paper.view.bounds
    const offset = new paper.Point(300, 100)

    const spawn1 = bounds.topLeft.add(offset)
    const spawn2 = bounds.bottomRight.subtract(offset)

    const test = new TestShape({
        // spawnPoint: spawn1,
        // rotation: 90 + 90
    })
    const test2 = new TestShape({
        // spawnPoint: spawn2
    })

    paper.view.onFrame = function () {
        test.seek2(test2)
        test.run()

        test2.run()
    }

    window.onmousemove = function (e: MouseEvent) {
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

