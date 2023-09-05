// TODO: Add ARIA elements and <tab> support
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _find from 'lodash/find'
import _noop from 'lodash/noop'

import { DIRECTION, getDirectionDetails } from 'shared/utils'
import View from 'components/View'

import styles from './styles.scss'

// TODO: Replace this with UUID or similar
const getRandomId = () => `${Math.floor(Math.random() * 1e12)}`

/*
 * View => {
 *   id: str,
 *   width: number,
 *   height: number,
 *   children: View[],
 *   neighbors: View{0,4},
 * }
 */

function ViewController({
  width,
  height,
  layout,
  neighbors,
  isVertical,
  isDragged,
  requestResize,
  requestDeletion,
}) {
  const containerRef = useRef()

  const [views, setViews] = useState()
  const [dragAction, setDragAction] = useState(null)

  useEffect(() => {
    const { children } = layout

    const totalWidth = children.reduce((total, view) => total + view.width, 0)
    const totalHeight = children.reduce((total, view) => total + view.height, 0)

    // Sanitize and process layout from props
    setViews(children.map((child, childIdx) => {
      const hasPrev = !!children[childIdx - 1]
      const hasNext = !!children[childIdx + 1]

      // Calculate adjacent elements to assist with rendering size controls
      const childNeighbors = isVertical ? {
        ...neighbors,
        [DIRECTION.top]: hasPrev || neighbors[DIRECTION.top],
        [DIRECTION.bottom]: hasNext || neighbors[DIRECTION.bottom],
      } : {
        ...neighbors,
        [DIRECTION.left]: hasPrev || neighbors[DIRECTION.left],
        [DIRECTION.right]: hasNext || neighbors[DIRECTION.right],
      }

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
    layout,
    neighbors,
    isVertical,
  ])

  const createContainedView = (replaceView, children = []) => ({
    id: getRandomId(),
    width: replaceView.width,
    height: replaceView.height,
    neighbors: { ...replaceView.neighbors },
    children,
  })

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
      complement: complementDirection,
    } = getDirectionDetails(direction)

    const activeView = _find(views, { id })
    const viewIndex = views.indexOf(activeView)

    // The new view should take up half of the old views space
    const newWidth = isDirectionVertical ? 1 : activeView.width / 2
    const newHeight = isDirectionVertical ? activeView.height / 2 : 1

    const newView = {
      id: getRandomId(),
      width: newWidth,
      height: newHeight,
      // The new view will displace the active view
      // eg direction = down --> new view will be in bottom half of old space,
      //    pushing the active view up, meaning the opposite neighbor is
      //    guarunteed
      neighbors: {
        ...activeView.neighbors,
        [complementDirection]: true,
      },
    }

    const children = isDirectionNegative ? [newView, activeView] : [activeView, newView]

    const insertedObjects = (isVertical === isDirectionVertical)
      ? children
      : [createContainedView(activeView, children)]

    activeView.width = newWidth
    activeView.height = newHeight

    setViews([
      ...views.slice(0, viewIndex),
      ...insertedObjects,
      ...views.slice(viewIndex + 1),
    ])
  }

  // TODO: Make this a callback
  const getDeleteInitiator = (id) => ({ direction, preserveViews = [] }) => {
    const {
      isNegative: isDirectionNegative,
    } = getDirectionDetails(direction)

    const activeView = _find(views, { id })
    const viewIndex = views.indexOf(activeView)

    const prevView = views[viewIndex - 1]
    const nextView = views[viewIndex + 1]

    // The adjacent view (if any) should expand to fill the empty space left by
    // the deleted view
    if (preserveViews.length === 0) {
      // Fallbacks are in case activeView is the first or last child
      const resizedView = isDirectionNegative ? (prevView || nextView) : (nextView || prevView)

      if (isVertical) {
        resizedView.height += activeView.height
      } else {
        resizedView.width += activeView.width
      }
    }

    const newViews = [
      ...views.slice(0, viewIndex),
      ...preserveViews,
      ...views.slice(viewIndex + 1),
    ]

    if (newViews.length <= 1) {
      // There will only be at most one element in this array
      newViews.forEach((view, viewIdx) => {
        newViews[viewIdx].width = width
        newViews[viewIdx].height = height
        newViews[viewIdx].neighbors = neighbors
      })
      requestDeletion({ direction, preserveViews: newViews })
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

    const activeView = _find(views, { id })
    const prevView = views[views.indexOf(activeView) - 1]
    const nextView = views[views.indexOf(activeView) + 1]

    switch (direction) {
      case DIRECTION.left:
        if (prevView) {
          activeView.width -= sizeDelta.x
          prevView.width += sizeDelta.x
        }
        break

      case DIRECTION.right:
        if (nextView) {
          activeView.width += sizeDelta.x
          nextView.width -= sizeDelta.x
        }
        break

      case DIRECTION.top:
        if (prevView) {
          activeView.height -= sizeDelta.y
          prevView.height += sizeDelta.y
        }
        break

      case DIRECTION.bottom:
        if (nextView) {
          activeView.height += sizeDelta.y
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
          layout={view}
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
  layout: PropTypes.shape({
    children: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  }).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  neighbors: PropTypes.shape({}),
  requestResize: PropTypes.func,
  requestDeletion: PropTypes.func,
  isDragged: PropTypes.bool,
  isVertical: PropTypes.bool,
}

ViewController.defaultProps = {
  width: 1,
  height: 1,
  neighbors: {},
  requestResize: _noop,
  requestDeletion: _noop,
  isDragged: false,
  isVertical: false,
}

export default ViewController
