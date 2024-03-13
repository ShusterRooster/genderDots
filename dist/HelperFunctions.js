export function random(min, max) {
    // Ensure min is less than max
    if (min > max) {
        [min, max] = [max, min];
    }
    return Math.random() * (max - min) + min;
}
export function checkLoaded() {
    return document.readyState === "complete";
}
export function consoleLog(name, value) {
    console.log(`${name}: ${value}`);
}
export function constrain(n, low, high) {
    return Math.max(Math.min(n, high), low);
}
export function map(n, start1, stop1, start2, stop2, withinBounds) {
    const newVal = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds) {
        return newVal;
    }
    if (start2 < stop2) {
        return this.constrain(newVal, start2, stop2);
    }
    else {
        return this.constrain(newVal, stop2, start2);
    }
}
export function between(n, min, max) {
    return n >= min && n <= max;
}
