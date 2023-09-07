// TODO: Add ARIA elements and <tab> support
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _find from 'lodash/find'
import _noop from 'lodash/noop'

import { DIRECTION, getDirectionDetails } from 'shared/utils/directions'
import View from 'components/View'

import styles from './styles.scss'

// TODO: Replace this with UUID or similar
const getRandomId = () => `${Math.floor(Math.random() * 1e12)}`

/*
 * View => {
 *   id: str,
 *   width: number,
 *   height: number,
 *   neighbors: bool{0,4},
 *   children: View[],
 * }
 */

function ViewController({
  initialLayout,
  width,
  height,
  neighbors,
  isVertical,
  isDragged,
  requestResize,
  requestDeletion,
}) {
  const containerRef = useRef()

  const [views, setViews] = useState()
  const [dragAction, setDragAction] = useState(null)

  const getViewNeighbors = (hasPrev, hasNext) => {
    const viewNeighbors = isVertical ? {
      ...neighbors,
      [DIRECTION.top]: hasPrev || neighbors[DIRECTION.top],
      [DIRECTION.bottom]: hasNext || neighbors[DIRECTION.bottom],
    } : {
      ...neighbors,
      [DIRECTION.left]: hasPrev || neighbors[DIRECTION.left],
      [DIRECTION.right]: hasNext || neighbors[DIRECTION.right],
    }

    return viewNeighbors
  }

  const createContainedView = (replaceView, children = []) => ({
    id: getRandomId(),
    width: replaceView.width,
    height: replaceView.height,
    neighbors: { ...replaceView.neighbors },
    children,
  })

  useEffect(() => {
    const { children } = initialLayout

    const totalWidth = children.reduce((total, view) => total + view.width, 0)
    const totalHeight = children.reduce((total, view) => total + view.height, 0)

    // Sanitize and process layout from props
    setViews(children.map((child, childIdx) => {
      const hasPrev = !!children[childIdx - 1]
      const hasNext = !!children[childIdx + 1]

      // Calculate adjacent elements to assist with rendering size controls
      const childNeighbors = getViewNeighbors(hasPrev, hasNext)

      // Normalize view dimensions (if they sum to a value other than 1)
      const viewWidth = !isVertical ? (child.width / totalWidth) : child.width
      const viewHeight = isVertical ? (child.height / totalHeight) : child.height

      return {
        ...child,
        neighbors: childNeighbors,
        width: viewWidth,
        height: viewHeight,
      }
    }))
  }, [
    // Note that all of these props are expected to change very infrequently
    initialLayout,
    neighbors,
    isVertical,
  ])

  // TODO: Optimize these callbacks using a method like: https://medium.com/@0utoftime/using-reacts-usecallback-hook-to-preserve-identity-of-partially-applied-callbacks-in-collections-3dbac35371ea
  const getResizeInitiator = (id) => ({ direction, origin }) => {
    const {
      isVertical: isDirectionVertical,
      isNegative: isDirectionNegative,
    } = getDirectionDetails(direction)

    const isFirstChild = views[0].id === id
    const isLastChild = views[views.length - 1].id === id

    // Resizing should always be done so that it aligns with the flex direction.
    // If the resize request is for the cross axis, then forward the request to
    // the parent container
    if (isVertical !== isDirectionVertical) {
      requestResize({ direction, origin })
    // If we are trying to resize in a direction that isn't possible
    // (eg left for the first child), forward the resize request to the parent
    } else if ((isFirstChild && isDirectionNegative) || (isLastChild && !isDirectionNegative)) {
      requestResize({ direction, origin })
    // Otherwise handle the request normally
    } else {
      setDragAction({ id, origin, direction })
    }
  }

  const getInsertInitiator = (id) => ({ direction }) => {
    const {
      isVertical: isDirectionVertical,
      isNegative: isDirectionNegative,
      reverse: reverseDirection,
    } = getDirectionDetails(direction)

    const targetView = _find(views, { id })
    const targetIndex = views.indexOf(targetView)

    // The new view should take up half of the old views space
    const newWidth = isDirectionVertical ? 1 : targetView.width / 2
    const newHeight = isDirectionVertical ? targetView.height / 2 : 1

    const newView = {
      id: getRandomId(),
      width: newWidth,
      height: newHeight,
      // The new view will displace the active view
      // eg direction = down --> new view will be in bottom half of old space,
      //    pushing the active view up, meaning the opposite neighbor is
      //    guarunteed
      neighbors: {
        ...targetView.neighbors,
        [reverseDirection]: true,
      },
    }

    const children = isDirectionNegative ? [newView, targetView] : [targetView, newView]

    const insertedObjects = (isVertical === isDirectionVertical)
      ? children
      : [createContainedView(targetView, children)]

    targetView.width = newWidth
    targetView.height = newHeight

    setViews([
      ...views.slice(0, targetIndex),
      ...insertedObjects,
      ...views.slice(targetIndex + 1),
    ])
  }

  // TODO: Make this a callback
  const getDeleteInitiator = (id) => ({ direction, preserveViews = [] }) => {
    const {
      isNegative: isDirectionNegative,
    } = getDirectionDetails(direction)

    const targetView = _find(views, { id })
    const targetIndex = views.indexOf(targetView)

    const newViews = [
      ...views.slice(0, targetIndex),
      ...preserveViews,
      ...views.slice(targetIndex + 1),
    ]

    const prevView = views[targetIndex - 1]
    const nextView = views[targetIndex + 1]

    const resizedView = isDirectionNegative ? (prevView || nextView) : (nextView || prevView)
    const resizedIndex = newViews.indexOf(resizedView)

    // If it is a container, it will have a populated 'children' array
    const isNestedContainer = !!newViews[0]?.children?.length

    // If and only if this is the first deletion in the chain
    if (preserveViews.length === 0) {
      resizedView.neighbors = getViewNeighbors(
        !!newViews[resizedIndex - 1],
        !!newViews[resizedIndex + 1],
      )

      if (isVertical) {
        resizedView.height += targetView.height
      } else {
        resizedView.width += targetView.width
      }
    }

    if (newViews.length <= 1 && !isNestedContainer) {
      // There will only be at most one element in this array
      resizedView.width = width
      resizedView.height = height

      requestDeletion({ direction, preserveViews: [resizedView] })
    }

    setViews(newViews)
  }

  // Note that this listener is conditionally applied, see component return value below
  const onMouseMove = ({ clientX, clientY }) => {
    const { id, origin, direction } = dragAction

    const sizeDelta = {
      x: (clientX - origin.x) / containerRef.current.offsetWidth,
      y: (clientY - origin.y) / containerRef.current.offsetHeight,
    }

    const targetView = _find(views, { id })
    const prevView = views[views.indexOf(targetView) - 1]
    const nextView = views[views.indexOf(targetView) + 1]

    switch (direction) {
      case DIRECTION.left:
        if (prevView) {
          targetView.width -= sizeDelta.x
          prevView.width += sizeDelta.x
        }
        break

      case DIRECTION.right:
        if (nextView) {
          targetView.width += sizeDelta.x
          nextView.width -= sizeDelta.x
        }
        break

      case DIRECTION.top:
        if (prevView) {
          targetView.height -= sizeDelta.y
          prevView.height += sizeDelta.y
        }
        break

      case DIRECTION.bottom:
        if (nextView) {
          targetView.height += sizeDelta.y
          nextView.height -= sizeDelta.y
        }
        break

      default:
        throw new Error(`Can't resize in unknown direction: '${direction}'`)
    }

    setViews([...views])
    setDragAction({
      ...dragAction,
      origin: {
        x: clientX,
        y: clientY,
      },
    })
  }

  const onMouseUp = () => {
    setDragAction(null)
  }

  const onMouseLeave = () => {
    setDragAction(null)
  }

  const childViewContent = views?.map((view) => {
    if (view.children?.length > 0) {
      return (
        <ViewController
          key={view.id}
          initialLayout={view}
          width={view.width}
          height={view.height}
          neighbors={view.neighbors}
          isDragged={!!dragAction || isDragged}
          isVertical={!isVertical}
          requestResize={getResizeInitiator(view.id)}
          requestDeletion={getDeleteInitiator(view.id)}
        />
      )
    }

    return (
      <View
        key={view.id}
        width={view.width}
        height={view.height}
        neighbors={view.neighbors}
        isDragged={!!dragAction || isDragged}
        requestResize={getResizeInitiator(view.id)}
        requestInsertion={getInsertInitiator(view.id)}
        requestDeletion={getDeleteInitiator(view.id)}
      />
    )
  })

  return (
    <div
      ref={containerRef}
      className={cx(styles.controller, {
        [styles.vertical]: isVertical,
      })}
      style={{
        width: `${width * 100}%`,
        height: `${height * 100}%`,
      }}
      onMouseMove={dragAction === null ? null : onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {childViewContent}
    </div>
  )
}

ViewController.propTypes = {
  initialLayout: PropTypes.shape({
    children: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  }).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  neighbors: PropTypes.shape({}),
  isDragged: PropTypes.bool,
  isVertical: PropTypes.bool,
  requestResize: PropTypes.func,
  requestDeletion: PropTypes.func,
}

ViewController.defaultProps = {
  width: 1,
  height: 1,
  neighbors: {},
  isDragged: false,
  isVertical: false,
  requestResize: _noop,
  requestDeletion: _noop,
}

export default ViewController
