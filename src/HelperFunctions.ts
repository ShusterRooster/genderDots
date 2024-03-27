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

export function setValueIfNull(given: any | undefined, def: any){
    if (given === undefined)
        return def
    else
        return given
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

export function map(n: number, start1: number, stop1: number, start2: number, stop2: number, withinBounds?: number) {
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