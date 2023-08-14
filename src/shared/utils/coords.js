/**
 * A small library of functions to be used on XY coordinates in the format:
 * {
 *   x: <number>,
 *   y: <number>
 * }
 */

// TODO: Name this the proper mathematical name
const elementWise = ({ x: x1, y: y1 }, { x: x2, y: y2 }, operation) => {
    return {
        x: operation(x1, x2),
        y: operation(y1, y2)
    }
}

export const sum = (coord1, coord2) => {
    return elementWise(coord1, coord2, (a, b) => a + b)
}

export const difference = (coord1, coord2) => {
    return elementWise(coord1, coord2, (a, b) => b - a)
}


export const product = (coord1, coord2) => {
    return elementWise(coord1, coord2, (a, b) => a * b)
}

const coords = {
    sum,
    difference,
    product,
}

export default coords