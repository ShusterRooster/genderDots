import GenderShape from "./shapeClasses";
export default class DotManager {
    static readonly minRadius: number;
    static readonly maxRadius: number;
    static readonly minVector: number;
    static readonly maxVector: number;
    static readonly minScaleSpeed: number;
    static readonly maxScaleSpeed: number;
    static readonly minDistance: number;
    static readonly genitalDiv: number;
    static readonly friction: number;
    static readonly normalForce: number;
    static readonly frictionMag: number;
    arr: GenderShape[];
    numWanted: number;
    constructor(numWanted: number);
    createTestShape(shape?: GenderShape): void;
    initDots(): void;
    iterator(): Generator<string, void, unknown>;
    checkCollision(): void;
    update(): void;
}
