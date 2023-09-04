// TODO: Clean this file

import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import _find from 'lodash/find'
import _noop from 'lodash/noop'

import { DIRECTION } from 'shared/utils/constants'
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
  controllerId,
  width,
  height,
  layout,
  neighbors,
  isVertical,
  isDragged,
  requestResize,
}) {
  const containerRef = useRef()

  const [ views, setViews ] = useState()
  const [ dragAction, setDragAction ] = useState(null)

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
        const viewWidth = !isVertical ? ( child.width / totalWidth ) : child.width
        const viewHeight = isVertical ? ( child.height / totalHeight ) : child.height

        return {
          ...child,
          neighbors: childNeighbors,
          width: viewWidth,
          height: viewHeight,
        }
      })
    )
  // Note that all of these props are expected to change very infrequently
  }, [
    layout,
    neighbors,
    isVertical,
  ])

  const createContainedView = (replaceView, children = []) => {
    return {
      id: getRandomId(),
      width: replaceView.width,
      height: replaceView.height,
      neighbors: { ...replaceView.neighbors },
      children: children.length > 0 ? children : [ replaceView ]
    }
  }

  const clearResize = () => {
    setDragAction(null)
  }

  // TODO: Optimize these callbacks using a method like: https://medium.com/@0utoftime/using-reacts-usecallback-hook-to-preserve-identity-of-partially-applied-callbacks-in-collections-3dbac35371ea
  const getResizeInitiator = id => ({ direction, origin }) => {
    const isActionVertical = (direction === DIRECTION.top || direction === DIRECTION.bottom)
    const isActionBeforeView = (direction === DIRECTION.top || direction === DIRECTION.left)

    const isFirstChild = views?.[0].id === id
    const isLastChild = views?.[views.length - 1].id === id

    // Resizing should always be done for the long axis so that it aligns with
    // the flex direction. If the resize request is for the short axis, then
    // forward the request to the parent container so that the pattern is
    // maintained.
    if (isVertical !== isActionVertical) {
      requestResize({ direction, origin })
    // If we are trying to resize in a direction that isn't possible
    // (eg left for the first child), pass thre resize request to the parent to
    // handle.
    } else if ((isFirstChild && isActionBeforeView) || (isLastChild && !isActionBeforeView)) {
      requestResize({ direction, origin })
    // Otherwise handle the request normally
    } else {
      setDragAction({ id, origin, direction })
    }
  }

  const getInsertInitiator = id => ({ direction }) => {
    const isActionVertical = (direction === DIRECTION.top || direction === DIRECTION.bottom)
    const isActionAligned = isVertical === isActionVertical

    const activeView = _find(views, { id })
    const viewIndex = views.indexOf(activeView)

    const oppositeDirection = (
      direction === DIRECTION.top ? DIRECTION.bottom :
      direction === DIRECTION.bottom ? DIRECTION.top :
      direction === DIRECTION.left ? DIRECTION.right :
      direction === DIRECTION.right ? DIRECTION.left :
      null
    )

    // The new view should take up half of the old views space
    const newDimensions = {
      width: isActionVertical ? 1 : activeView.width / 2,
      height: isActionVertical ? activeView.height / 2 : 1
    }

    // The new view will displace the active view
    // eg direction = down --> new view will be in bottom half of old space,
    //    pushing the active view up, M=meaning the opposite neighbor is
    //    guarunteed
    const newView = {
      id: getRandomId(),
      ...newDimensions,
      neighbors: {
        ...activeView.neighbors,
        [oppositeDirection]: true
      }
    }

    const children = (direction === DIRECTION.top || direction === DIRECTION.left)
      ? [ newView, activeView ]
      : [ activeView, newView ]

    const intertedObjects = isActionAligned
      ? children
      : [ createContainedView(activeView, children) ]

    activeView.width = newDimensions.width
    activeView.height = newDimensions.height

    setViews([
      ...views.slice(0, viewIndex),
      ...intertedObjects,
      ...views.slice(viewIndex + 1)
    ])
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
        console.error(`Can't resize in unknown direction: '${direction}'`)
    }

    setViews([...views])
    setDragAction({
      ...dragAction,
      origin: {
        x: clientX,
        y: clientY
      }
    })
  }

  const onMouseUp = () => {
    clearResize()
  }

  const onMouseLeave = () => {
    clearResize()
  }

  const childViewContent = views?.map(view => {
    if (view.children?.length > 0) {
      return (
        <ViewController
          key={view.id}
          layout={view}
          width={view.width}
          height={view.height}

          controllerId={view.id}
          neighbors={view.neighbors}
          isDragged={!!dragAction || isDragged}
          isVertical={!isVertical}
          requestResize={getResizeInitiator(view.id)}
        />
      )
    }

    return (
      <View
        key={view.id}
        width={view.width}
        height={view.height}

        viewId={view.id}
        neighbors={view.neighbors}
        isDragged={!!dragAction || isDragged}
        requestResize={getResizeInitiator(view.id)}
        requestInsertion={getInsertInitiator(view.id)}
      />
    )
  })

  return (
    <div
      ref={containerRef}
      className={cx(styles.controller, {
        [styles.vertical]: isVertical
      })}
      style={{
        width:  `${width * 100}%`,
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
  layout: PropTypes.shape({}).isRequired,
  controllerId: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  neighbors: PropTypes.shape({}),
  requestResize: PropTypes.func,
  isDragged: PropTypes.bool,
  isVertical: PropTypes.bool,
}

ViewController.defaultProps = {
  width: 1,
  height: 1,
  neighbors: {},
  requestResize: _noop,
  isDragged: false,
  isVertical: false,
}

export default ViewController
