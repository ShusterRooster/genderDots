import paper from "paper";
import ChainRelationship from "../relationship/ChainRelationship";
import OrbitRelationship from "../relationship/OrbitRelationship";
import ShapeManager from "../ShapeManager";
import AdultShape from "../AdultShape";
import Relationship from "../relationship/Relationship";
import {debugMode} from "../../Settings";

const dotInfo = document.getElementById('dotInfo') as HTMLDivElement
const searchBar = document.getElementById("dotSearch") as HTMLInputElement
const searchList = document.getElementById("searchList") as HTMLUListElement
const listItems = searchList.getElementsByTagName("li")

let moving = true
let hoverArr: AdultShape[] = []


export function enableDebugTools(shapeManager: ShapeManager) {
    shiftKey()
    mouseMove(shapeManager)
    mouseDown(shapeManager)

    searchBar.value = ""

    searchItems()
    enterSearch(shapeManager)
}

function shiftKey() {
    if (searchBar === document.activeElement) return

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
}


function mouseMove(shapeManager: ShapeManager) {
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
                const condition = rel.path.bounds.contains(mPt)

                rel.path.selected = condition
                rel.boundsRect!.selected = condition

                if (condition)
                    dotInfo.innerHTML = rel.info()

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
            if (shape && shape.shape.bounds.contains(mPt)) {
                hoverArr.push(shape)
            }
            else
                shape.bounds.selected = false
        }

        if (hoverArr.length > 0) {
            const shape = hoverArr[0]
            dotInfo.innerHTML = `${shape.name!}<br>`

            if (shape.inRelationship)
                dotInfo.innerHTML += shape.relationship?.info()

            shape.bounds.selected = true
        }

        hoverArr = []
    }
}

function mouseDown(shapeManager: ShapeManager) {
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

export function addSearchData(item: AdultShape | Relationship, shapeManager: ShapeManager) {
    if (!debugMode) return;

    const li = document.createElement("li")
    li.innerText = item.name
    li.style.display = "none"

    li.onmousedown = () => {
        searchBar.value = li.innerText
        searchForName(searchBar.value, shapeManager)
        searchBar.value = ""
        li.style.display = "none"
    }

    searchList.appendChild(li)
}

export function removeSearchData(item: AdultShape | Relationship) {
    if (!debugMode) return;

    for (let i = 0; i < listItems.length; i++) {
        const li = listItems[i]

        if (li.innerText == item.name) {
            li.remove()
            return
        }
    }
}

function searchItems() {
    searchBar.addEventListener("keyup", function () {
        for (let i = 0; i < listItems.length; i++) {
            const li = listItems[i]

            const filter = searchBar.value.toLowerCase()

            if (li.innerText.toLowerCase().indexOf(filter) > -1) {
                li.style.display = "block"
            } else {
                li.style.display = "none"
            }
        }
    })
}

function searchForName(input: string, shapeManager: ShapeManager) {
    input = input.toLowerCase()
    const firstWord = input.substring(0, input.indexOf(' '))

    if (firstWord == "adultshape") {
        for (const shape of shapeManager.adults) {
            if (shape.name.toLowerCase() == input) {
                shape.eventLog?.printAll()
                shape.relationship?.eventLog?.printAll()
                shape.shape.selected = true
                return
            }
        }

        console.log(`No shape found with the name ${input}. Please try again`)
    } else if (firstWord.includes("relationship")) {
        for (const rel of shapeManager.relationships) {
            if (rel.name.toLowerCase() == input) {
                rel.eventLog?.printAll()
                return;
            }
        }
        console.log(`No relationship found with the name ${input}. Please try again`)
    } else {
        console.log("Nothing found! Try again.")
    }
}

function enterSearch(shapeManager: ShapeManager) {
    searchBar.addEventListener("keypress", function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            searchBar.click();

            searchForName(searchBar.value, shapeManager)
        }
    })
}

