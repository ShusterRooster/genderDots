import {Probability} from "./src/HelperFunctions";

//Dots
export const sexes: Probability[] = [
    { name: "male", probability: 48.7 },
    { name: "female", probability: 47.9 },
    { name: "intersex", probability: 1.7 },
];

export const minRadius: number = 15;
export const maxRadius: number = 100;
export const minVector: number = 5;
export const maxVector: number = 10;
export const minDistance: number = 25;
export const maxDistance: number = 1000;
export const baseScaleSpeed: number = 7.5;
export const outerBoundsOffset: number = maxRadius * 4;
export const minSize: number = minRadius * (minRadius / 5) ** 2;
export const maxSize: number = maxRadius ** 3;
export const genitalDiv: number = 5;
export const lonerChance: number = 15;
export const maxForce: number = 1;
export const friction: number = 0.32;
export const normalForce: number = 1;
export const frictionMag: number = friction * normalForce;

//Color
export const minShadowBlur: number = 25
export const maxShadowBlur: number = 50
export const minGray: number = 0.32

//Relationship
export const attractionTypes: string[] = ["similar", "diff", "random"];
export const relationshipTypes: string[] = [
    "seek",
    "orbit",
    "chain",
    "merge",
];

export const maxPartners: number = 6;
export const chainThickness: number = 8;
export const stealChance: number = 5;
export const minChainLength: number = minRadius * 1.50
export const maxChainLength: number = maxRadius * 1.50
export const minAttrFactor: number = 0
export const maxAttrFactor: number = 0.5
