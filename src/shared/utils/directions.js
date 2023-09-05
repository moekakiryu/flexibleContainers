import { DIRECTION } from './constants'

/* eslint-disable */
export const getDirectionDetails = (direction) => ({
  isVertical: direction === DIRECTION.top || direction === DIRECTION.bottom,
  isNegative: direction === DIRECTION.top || direction === DIRECTION.left,
  complement: (
    direction === DIRECTION.top ? DIRECTION.bottom :
    direction === DIRECTION.bottom ? DIRECTION.top :
    direction === DIRECTION.left ? DIRECTION.right :
    direction === DIRECTION.right ? DIRECTION.left :
    null
  ),
})
/* eslint-enable */
