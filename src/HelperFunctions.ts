export interface Probability {
    name: string,
    probability: number
}

export class PathArray {
    name: string
    arr: paper.Path[]
    cleanDist: number

    constructor(name: string, cleanDist = 1) {
        this.name = name
        this.arr = []
        this.cleanDist = cleanDist
    }

    push(...args: any[]) {
        args.forEach((arg) => {
            this.arr.push(arg)
        })

        this.scrubArr()
    }

    //deletes everything but last element in array unless specified otherwise
    scrubArr() {
        const len = this.arr.length

        if (len > this.cleanDist) {
            for (let i = 0; i < len - this.cleanDist; i++) {
                this.arr[i].remove()
            }
        }

        this.arr = this.arr.slice(len - this.cleanDist)
    }

    clearArr() {
        for (const path of this.arr) {
            path.remove()
        }
    }

    print(text?: string) {
        if (text)
            console.log(`${text}, ${this.name}: ${this.arr}`)
        else
            console.log(`${this.name}: [${this.arr}]`)
    }
}

export function removeFromArray(arr: any[], obj: any) {
    arr.splice(arr.indexOf(obj), 1)
}

export function determineProb(prob: number){
    return (Math.random() * 100) <= prob
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