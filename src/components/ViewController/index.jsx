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

function ViewController(props) {
  const containerRef = useRef()

  const [ views, setViews ] = useState()
  const [ dragAction, setDragAction ] = useState(null)

  useEffect(() => {
    const { children } = props.layout

    const totalWidth = children.reduce((total, child) => total + child.width, 0)
    const totalHeight = children.reduce((total, child) => total + child.height, 0)

    // Sanitize and process layout from props
    setViews(children.map((child, childIdx) => {
      const hasPrev = !!children[childIdx - 1]
      const hasNext = !!children[childIdx + 1]

      // Calculate adjacent elements to assist with rendering size controls
      const childNeighbors = props.isVertical ? {
        ...props.neighbors,
        [DIRECTION.top]: hasPrev || props.neighbors[DIRECTION.top],
        [DIRECTION.bottom]: hasNext || props.neighbors[DIRECTION.bottom],
      } : {
        ...props.neighbors,
        [DIRECTION.left]: hasPrev || props.neighbors[DIRECTION.left],
        [DIRECTION.right]: hasNext || props.neighbors[DIRECTION.right],
      }

      // Normalize the values in the long axis in case they sum to grater than 100%
      const childWidth = !props.isVertical ? ( child.width / totalWidth ) : child.width
      const childHeight = props.isVertical ? ( child.height / totalHeight ) : child.height

      return {
        ...child,
        width: childWidth,
        height: childHeight,
        neighbors: childNeighbors,
      }
    }))
  // Note that none of these props are expected to change frequently
  }, [
    props.layout,
    props.neighbors,
    props.isVertical
  ])

  const requestResize = ({ id, direction, origin }) => {
    const isResizeVertical = (direction === DIRECTION.top || direction === DIRECTION.bottom)

    const isFirstChild = views?.[0].id === id
    const isLastChild = views?.[views.length - 1].id === id

    const isBeyondHorizontalBounds = !props.isVertical && (
      (isFirstChild && direction === DIRECTION.left) ||
      (isLastChild && direction === DIRECTION.right)
    )
    const isBeyondVerticalBounds = props.isVertical && (
      (isFirstChild && direction === DIRECTION.up) ||
      (isLastChild && direction === DIRECTION.down)
    )

    // Resizing should always be done for the long axis so that it aligns with
    // the flex direction. If the resize request is for the short axis, then
    // forward the request to the parent container so that the pattern is
    // maintained.
    if (props.isVertical !== isResizeVertical) {
      props.requestResize({ id: props.controllerId, direction, origin})
    // If we are trying to resize in a direction that isn't possible
    // (eg left for the first child), pass thre resize request to the parent to
    // handle.
    } else if (isBeyondHorizontalBounds || isBeyondVerticalBounds) {
      props.requestResize({ id: props.controllerId, direction, origin })
    // Otherwise handle the request normally
    } else {
      setDragAction({ id, origin, direction })
    }
  }

  const stopResize = () => {
    setDragAction(null)
  }

  const insertView = ({ id, direction }) => {
    const isActionVertical = (direction === DIRECTION.top || direction === DIRECTION.bottom)
    const isInsertionBeforeView = (direction === DIRECTION.top || direction === DIRECTION.left)

    const activeView = _find(views, { id })
    const viewIndex = views.indexOf(activeView)

    const oppositeDirection = (
      direction === DIRECTION.top ? DIRECTION.bottom :
      direction === DIRECTION.bottom ? DIRECTION.top :
      direction === DIRECTION.left ? DIRECTION.right :
      direction === DIRECTION.right ? DIRECTION.left :
      null
    )

    const newView = {
      id: getRandomId(),
      // The new view should take up half of the old views space
      width: isActionVertical ? 1 : activeView.width / 2,
      height: isActionVertical ? activeView.height / 2 : 1,
      // The new view will displace the active view
      // eg direction = down --> new view will be in bottom half of old space,
      //    pushing the active view up, M=meaning the opposite neighbor is
      //    guarunteed
      neighbors: {
        ...activeView.neighbors,
        [oppositeDirection]: true
      }
    }

    const newContainer = {
      id: getRandomId(),
      width: activeView.width,
      height: activeView.height,
      neighbors: { ...activeView.neighbors },
      children: isInsertionBeforeView ? [ newView, activeView ] : [ activeView, newView ]
    }

    // Halve the size of the long axis to make room for the newly inserted view
    if (isActionVertical) {
      activeView.height /= 2
    } else {
      activeView.width /= 2
    }

    if (props.isVertical === isActionVertical) {
      setViews([
        ...views.slice(0, viewIndex),
        ...isInsertionBeforeView ? [ newView, activeView ] : [ activeView, newView ],
        ...views.slice(viewIndex + 1)
      ])
    } else {
      // Since we are swapping orientations, reset new short axis to 100% of
      // container size
      if (isActionVertical) {
        activeView.width = 1
      } else {
        activeView.height = 1
      }

      // Add in the new container, and also remove the old activeView, which
      // is now a child of said container
      setViews([
        ...views.slice(0, viewIndex),
        newContainer,
        ...views.slice(viewIndex + 1)
      ])
    }
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
    stopResize()
  }

  const onMouseLeave = () => {
    stopResize()
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
          requestResize={requestResize}
          isDragged={!!dragAction || props.isDragged}
          isVertical={!props.isVertical}
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
        isDragged={!!dragAction || props.isDragged}
        requestResize={requestResize}
        requestInsertion={insertView}
      />
    )
  })

  return (
    <div
      ref={containerRef}
      className={cx(styles.controller, {
        [styles.vertical]: props.isVertical
      })}
      style={{
        width:  `${props.width * 100}%`,
        height: `${props.height * 100}%`,
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
