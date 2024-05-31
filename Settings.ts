import {Probability} from "./src/Interfaces";

//Dots
export const sexes: Probability[] = [
    { name: "male", probability: 48.7 },
    { name: "female", probability: 47.9 },
    { name: "intersex", probability: 1.7 },
];

export const minRadius: number = 15;
export const maxRadius: number = 100;
export const genitalDiv: number = 5;

export const minVector: number = 2.5;
export const maxVector: number = 7.5;

export const minDistance: number = 25;
export const maxDistance: number = 350;
export const baseScaleSpeed: number = 7.5;

export const minGrowSpeed: number = 0.5;
export const maxGrowSpeed: number = 5;

export const minSize: number = minRadius * (minRadius / 5) ** 2;
export const maxSize: number = maxRadius ** 3;

export const lonerChance: number = 0.15;
export const maxForce: number = 1;
export const friction: number = 0.32;
export const borderOffset: number = maxRadius;

//Color
export const minGray: number = 0.32
export const minThickness: number = 1
export const maxThickness: number = 12

//Relationship
export const relationshipTypes: string[] = [
    "seek",
    "chain",
    "orbit"
];

export const seekInterval: number = 2500
export const maxPartners: number = 6;
export const stealChance: number = 0.20;
export const attractionThreshold: number = 100;

//Chain
export const chainMoveDiv: number = 4
export const minChainThickness: number = 3
export const chainThickness: number = 5
export const maxChainThickness: number = 6
export const minChainLength: number = 50
export const maxChainLength: number = 300

//Orbit
export const orbitOffset: number = 0
export const minOrbitSpeed: number = 1
export const maxOrbitSpeed: number = 8