import paper from "paper";
import AdultShape from "./AdultShape";
import Relationship from "./relationship/Relationship";

export function removeFromArray(arr: any[], obj: any) {
    arr.splice(arr.indexOf(obj), 1)
}

/**
 * Checks if a given probability is solved true. Uses Math.random()
 * @param prob Number between 0 - 1
 */
export function determineProb(prob: number) {
    return (Math.random()) <= prob
}

/**
 * Returns a long string of a desired attribute from objects in a given array.
 * @param type The type of object to check inside
 * @param arr The array to check for a desired attribute
 * @param attr String for declaring what attribute is desired.
 */
export function getAttrFromArray(type: any, arr: any[] | Set<any>, attr: string) {
    type Key = keyof typeof type
    const prop = attr as Key
    let str = ""

    for (const obj of arr) {
        str += `${obj[prop]}<br>`
    }

    return str
}

/**
 * Generates random alphanumerical character
 * A-Z and 0-9
 */
export function genRandChar() {
    const characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`
    return characters.charAt(random(0, characters.length - 1))
}

/**
 * Generates a name/ID for a given AdultShape or Relationship. Used for debugging purposes.
 * (i.e. AdultShape EV46U)
 * @param obj Object to make ID for
 * @param check Calls for ShapeManager instance to make sure no other object has this ID
 * @param length Desired length for ID, Default is 5
 */
export function generateID(obj: AdultShape | Relationship, check: Set<AdultShape | Relationship>, length = 5) {
    let str = `${obj.constructor.name} `
    for (let i = 0; i < length; i++) {
        str += genRandChar()
    }

    for (const obj of check) {
        if (obj.name == str) {
            generateID(obj, check, length)
        }
    }

    return str
}

/**
 * Returns random float between specified min and max.
 * @param min
 * @param max
 */
export function random(min: number, max: number) {
    // Ensure min is less than max
    if (min > max) {
        [min, max] = [max, min]
    }

    return Math.random() * (max - min) + min
}

/**
 * Returns random object from a given array.
 * @param arr
 */
export function randomFromArr(arr: any[]) {
    return arr[Math.floor((Math.random() * arr.length))];
}

/**
 * Creates an instance of a given class with given arguments.
 * @param ctor Constructor of a class.
 * @param args Arguments for the constructor.
 */
export function createInstance<T>(ctor: new (...args: any[]) => T, ...args: any[]): T {
    return new ctor(...args);
}

/**
 * Returns a given number constrained between a given min and max
 * @param n Number to be constrained
 * @param low
 * @param high
 */
export function constrain(n: number, low: number, high: number) {
    return Math.max(Math.min(n, high), low);
}

export function limit(n: number, limit: number) {
    return n >= limit ? limit : n
}


/**
 * Maps a given number according to a scale comparing start1-stop1 to start2-stop2.
 * Taken from p5.js
 * @param n Number to be mapped
 * @param start1
 * @param stop1
 * @param start2
 * @param stop2
 * @param withinBounds
 */
export function map(n: number, start1: number, stop1: number, start2: number, stop2: number, withinBounds?: boolean) {
    const newVal = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds) {
        return newVal;
    }
    if (start2 < stop2) {
        return constrain(newVal, start2, stop2);
    } else {
        return constrain(newVal, stop2, start2);
    }
}

/**
 * Checks if a given number is between two values.
 * @param n
 * @param min
 * @param max
 */
export function between(n: number, min: number, max: number) {
    return n >= min && n <= max
}


/**
 * Returns the calculated distance between two Paper.js colors.
 * @param color
 * @param other
 */
export function colorDistance(color: paper.Color, other: paper.Color) {
    const redDist = (other.red - color.red) ** 2
    const greenDist = (other.green - color.green) ** 2
    const blueDist = (other.blue - color.blue) ** 2

    return Math.sqrt(redDist + greenDist + blueDist) * 255
}

/**
 * Essentially a constructor for setTimeout. Can be used for delaying async functions.
 * @param ms
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a path is out of bounds
 * @param path
 */
export function outOfBounds(path: paper.Path) {
    return (!path.bounds.intersects(paper.view.bounds));
}

export function inBounds(path: paper.Path) {
    return paper.view.bounds.contains(path.position)
}

export function tolerance(val: number, n: number, tol: number) {
    return between(val, tol - n, tol + n)
}

export function pythag(a: number, b: number) {
    return Math.sqrt((a ** 2) + (b ** 2))
}

export function testLine(from: paper.Point, to: paper.Point, color = "red", width = 3) {
    return new paper.Path.Line({
        from: from,
        to: to,
        strokeWidth: width,
        strokeColor: color
    })
}

export function testLength(start: paper.Point, length: number, angle: number, color?: string, width?: number) {
    const point = new paper.Point({
        length: length,
        angle: angle
    }).add(start)


    return testLine(start, point, color, width)
}

export function testDot(center: paper.Point, radius = 3, color: string | paper.Color = "green") {
    return new paper.Path.Circle({
        center: center,
        radius: radius,
        fillColor: color
    })
}

export function centerOpposite(point: paper.Point, center = paper.view.center) {
    const dist = point.subtract(center).multiply(-1);
    return center.add(dist);
}

export function endPoint(start: paper.Point, length: number, angle: number) {
    return new paper.Point({
        length: length,
        angle: angle
    }).add(start)
}

export function nearestBounds(point: paper.Point): [paper.Point, paper.Point] {
    const bounds = paper.view.bounds
    const center = paper.view.center

    const xBounds = point.clone()
    const yBounds = point.clone()

    yBounds.y = point.y > center.y ? bounds.bottom : 0
    xBounds.x = point.x > center.x ? bounds.right : 0

    return [xBounds, yBounds]
}

export function oldNearestBounds(p: paper.Point) {
    const bounds = paper.view.bounds
    const center = paper.view.center

    const diff = p.subtract(center)
    const absDiff = center.subtract(diff.abs())
    const point = p.clone()

    if (absDiff.y < absDiff.x)
        point.y = point.y > center.y ? bounds.bottom : 0
    else
        point.x = point.x > center.x ? bounds.right : 0

    return point
}

export function constrainPoint(point: paper.Point,
                               minX: number, minY: number,
                               maxX: number, maxY: number) {

    const p = point.clone()
    p.x = constrain(p.x, minX, maxX)
    p.y = constrain(p.y, minY, maxY)
    return p
}

export function direction(n: number) {
    return n < 0 ? -1 : 1;
}