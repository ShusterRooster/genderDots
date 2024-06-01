import paper from "paper";
import AdultShape from "./AdultShape";

export function removeFromArray(arr: any[], obj: any) {
    arr.splice(arr.indexOf(obj), 1)
}

export function determineProb(prob: number){
    return (Math.random()) <= prob
}

export function random(min: number, max: number) {
    // Ensure min is less than max
    if (min > max) {
        [min, max] = [max, min]
    }

    return Math.random() * (max - min) + min
}

export function randomFromArr(arr: any[]){
    return arr[Math.floor((Math.random() * arr.length))];
}

export function checkLoaded() {
    return document.readyState === "complete";
}

export function consoleLog(name: string, value: any){
    console.log(`${name}: ${value}`)
}

export function constrain (n: number, low: number, high: number) {
    return Math.max(Math.min(n, high), low);
}

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

export function between(n: number, min: number, max: number) {
    return n >= min && n <= max
}

export function colorDistance(color: paper.Color, other: paper.Color) {
    const redDist = (other.red - color.red) ** 2
    const greenDist = (other.green - color.green) ** 2
    const blueDist = (other.blue - color.blue) ** 2

    return Math.sqrt(redDist + greenDist + blueDist) * 255
}

//returns true if out of bounds
export function outOfBounds(path: paper.Path) {
    return (
        !paper.view.bounds.contains(path.position) && !path.bounds.intersects(paper.view.bounds)
    );
}