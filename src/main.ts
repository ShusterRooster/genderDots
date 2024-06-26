import paper from "paper";
import ShapeManager from "./ShapeManager";
import {constrain} from "./HelperFunctions";
import OrbitRelationship from "./relationship/OrbitRelationship";
import ChainRelationship from "./relationship/ChainRelationship";
import {debugMode, numWanted} from "../Settings";


/**
 * Calculates scale of the screen compared to a width of 2000px.
 * Scale is from 0.1 - 1.
 */
function calcScale() {
    const maxRes = 2000
    return constrain(window.innerWidth / maxRes, 0.1, 1)
}

window.onload = function () {
    const canvas = document.getElementById('dotsCanvas') as HTMLCanvasElement
    const dotInfo = document.getElementById('dotInfo') as HTMLDivElement
    paper.setup(canvas)

    const width = window.innerWidth
    console.log(width)

    const shapeManager = new ShapeManager(numWanted)
    paper.view.onFrame = function () {
        shapeManager.update()
    }

    let scale = calcScale()

    paper.view.onResize = function () {
        paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
        paper.view.scale(1 / scale)
        paper.view.scale(calcScale())
        scale = calcScale()
    }

    if (debugMode) {
        let moving = true

        /**
         * When pressing shift key, program will start or stop depending on the current state
         */
        document.addEventListener('keydown', function (e) {
            if (e.shiftKey) {
                if (moving)
                    paper.view.pause()
                else
                    paper.view.play()

                moving = !moving
            }

        })

        window.onmousemove = function (e: MouseEvent) {
            const mPt = new paper.Point(e.clientX, e.clientY)

            dotInfo.style.top = e.clientY + "px"
            dotInfo.style.left = (e.clientX + 20) + "px"
            dotInfo.innerHTML = ""

            for (const rel of shapeManager.relationships) {

                /**
                 * While checking every relationship, if it is an OrbitRelationship,
                 * the path of the orbit will be selected and the info bar will be populated with information specific to OrbitRelationships
                 */
                if (rel instanceof OrbitRelationship) {
                    if (rel.path.bounds.contains(mPt)) {
                        rel.path.selected = true
                        dotInfo.innerHTML = rel.info()
                    } else {
                        rel.path.selected = false
                    }

                    /**
                     * If the relationship is a ChainRelationship, all chains in that relationship will be selected and
                     * the info bar will be populated with relevant information about ChainRelationships.
                     */
                } else if (rel instanceof ChainRelationship) {
                    for (const chain of rel.chainSet) {
                        if (chain.chain) {
                            if (chain.chain.bounds.contains(mPt)) {
                                chain.chain.selected = true
                                dotInfo.innerHTML = rel.info()
                            } else {
                                chain.chain.selected = false
                            }
                        }
                    }
                }
            }


            /**
             * If mouse is above an AdultShape, the relationship info will be ignored and just show information about the shape.
             */
            for (const shape of shapeManager.adults) {
                if (shape) {
                    if (shape.shape.bounds.contains(mPt)) {
                        dotInfo.innerHTML = `${shape.name!}<br>`

                        if(shape.inRelationship)
                            dotInfo.innerHTML += shape.relationship?.info()
                    }
                }

                shape.shape.bounds.selected = shape.shape.bounds.contains(mPt)
            }

        }

        window.onmousedown = function (e: MouseEvent) {
            const mPt = new paper.Point(e.clientX, e.clientY)


            /**
             * When clicking on a shape, it will print the information about the shape and if it's in a relationship it will print that as well.
             */
            for (const shape of shapeManager.adults) {
                if (shape.shape.bounds.contains(mPt)) {
                    shape.eventLog?.printAll()

                    if (shape.inRelationship) {
                        shape.relationship?.eventLog!.printAll()
                        return
                    }
                }
            }


            /**
             * When clicking on a relationship object (i.e. orbit path) it will print the eventLog of that relationship, handy!
             */
            for (const rel of shapeManager.relationships) {
                if (rel instanceof OrbitRelationship && rel.path.bounds.contains(mPt)) {
                    rel.eventLog!.printAll()
                } else if (rel instanceof ChainRelationship) {
                    for (const chain of rel.chainSet) {
                        if (chain.chain && chain.chain.bounds.contains(mPt))
                            rel.eventLog!.printAll()
                    }
                }
            }
        }
    }
}