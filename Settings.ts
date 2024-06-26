/**
 * Enables the usage of EventLog.ts and UI debugging tools
 */
export const debugMode = true

export interface Probability {
    name: string,
    probability: number
}

//Shapes
/**
 * Number of shapes wanted when running the program
 */
export const numWanted: number = 35

/**
 * Probability of each gender showing up in the program. Change as desired.
 */
export const sexes: Probability[] = [
    { name: "male", probability: 48.7 },
    { name: "female", probability: 47.9 },
    { name: "intersex", probability: 1.7 },
];

export const minRadius: number = 15;
export const maxRadius: number = 100;

/**
 * Ratio of genitalia to shape radius.
 * radius / genitalDiv = genital (w or h)
 */
export const genitalDiv: number = 5;

export const minVector: number = 1;
export const maxVector: number = 6;

/**
 * Div of how fast a shape can rotate, the lower the faster
 */
export const rotationSpeedDeg: number = 120;

/**
 * Tolerance of how accurate the angle needs to be when pointing towards it.
 */
export const rotationTolerance: number = 2

/**
 * Minimum distance away from 0 that a BabyShape can be for scaling.
 */
export const minDistance: number = 25;

/**
 * Maximum distance away from 0 that a BabyShape can be for scaling.
 */
export const maxDistance: number = 350;

/**
 * Scale speed multiplier. The higher, the faster.
 */
export const baseScaleSpeed: number = 7.5;

/**
 * Maximum time in milliseconds an AdultShape can be out of bounds (OOB)
 */
export const maxTimeOOB: number = 3000

/**
 * Maximum speed an AdultShape can seek() towards another AdultShape.
 */
export const maxSeekSpeed: number = 20

/**
 * Minimum growth speed for genitalia development.
 */
export const minGrowSpeed: number = 0.5;

/**
 * Maximum growth speed for genitalia development.
 */
export const maxGrowSpeed: number = 5;

/**
 * Minimum size calculation based on how size is calculated
 * size = genitalWidth * genitalHeight * radius
 */
export const minSize: number = minRadius * (minRadius / genitalDiv) ** 2;

/**
 * Maximum size calculation based on how size is calculated
 * size = genitalWidth * genitalHeight * radius
 */
export const maxSize: number = maxRadius ** 3;

/**
 * Amount of movement friction AdultShapes are applied.
 */
export const friction: number = 0.5;

//Color
/**
 * Used for gray generation for loner shapes. Used in BabyShapes.
 */
export const minGray: number = 0.32

/**
 * Minimum stroke thickness for shapes
 */
export const minThickness: number = 1

/**
 * Maximum stroke thickness for shapes
 */
export const maxThickness: number = 12

//Relationship

/**
 * Delay for running recursive loops to avoid too much recursion error.
 */
export const recursiveDelay: number = 20
export const minRelationships: number = Math.floor(numWanted / 5)
export const maxRelationships: number = Math.floor(numWanted / 3)

/**
 * Chance of a shape being a loner.
 * A loner is a shape who will never be in a relationship.
 */
export const lonerChance: number = 0.15;

/**
 * How many milliseconds the ShapeManager wait to run openRelationships.
 */
export const seekInterval: number = 1000

/**
 * Maximum partners any relationship instance is able to have.
 */
export const maxPartners: number = 6;

/**
 * Probability of a relationship stealing a shape that is in another relationship.
 */
export const stealChance: number = 0.50;

/**
 * The calculated color diff between two shapes must match up to this value
 */
export const attractionThreshold: number = 100;

//Chain

/**
 * Div of how fast shapes in ChainRelationships move based on pushing and pulling from the chain.
 */
export const chainMoveDiv: number = 5

/**
 * Stroke width of chains in any relationship.
 */
export const chainThickness: number = 5

/**
 * Minimum length a chain can be before it is constrained.
 */
export const minChainLength: number = 150

/**
 * Maximum length a chain can be before it is constrained.
 */
export const maxChainLength: number = 450

/**
 * How fast chains will grow to attach to each connector.
 */
export const chainGrowSpeed: number = 15

/**
 * How fast chains will shrink when the conditions are met.
 */
export const chainShrinkSpeed: number = 5

/**
 * Timeout for chain shrinking because it is outside the main program loop.
 */
export const chainShrinkDelay: number = 5

//Orbit

/**
 * Added offset to orbitDistance for orbit paths.
 * Change as needed
 */
export const orbitOffset: number = 0
export const orbitPathOpacity: number = 0.32
export const orbitPathFadeSpeed: number = 0.03

/**
 * Millisecond delay for repeating recursive methods.
 */
export const orbitSeekDelay: number = 10

export const minOrbitRotateSpeed: number = 0.05
export const maxOrbitRotateSpeed: number = 1

/**
 * Minimum speed for how fast a shape moves in an orbit.
 */
export const minOrbitSpeed: number = 1

/**
 * Maximum speed for how fast a shape moves in an orbit.
 */
export const maxOrbitSpeed: number = 8

/**
 * Minimum segments a trail in an OrbitRelationship can have.
 */
export const minTrailSegments: number = 20

/**
 * Maximum segments a trail in an OrbitRelationship can have.
 */
export const maxTrailSegments: number = 50

/**
 * Minimum trail segment length. Used for calculations.
 */
export const minTrailLength: number = 10

/**
 * Maximum trail segment length. Used for calculations.
 */
export const maxTrailLength: number = 25

/**
 * Minimum difference length between previous and current point in drawing a trail.
 */
export const minTrailVector: number = 0.01

/**
 * Maximum difference length between previous and current point in drawing a trail.
 */
export const maxTrailVector: number = 20

export const trailOpacity: number = 0.33
export const trailFadeSpeed: number = 0.08
export const trailFadeDelay: number = 100
