import React, { useEffect, useState, useRef } from "react"
import PropTypes from 'prop-types'
import cx from "classnames"
import _find from 'lodash/find'

import { decimalToPercent } from "shared/utils/units"
import { POSITION } from "./SizeControl";
import View from './View'

import styles from './styles.scss'

function ViewController(props) {
  const containerRef = useRef()

  const [ views, setViews ] = useState()
  const [ dragAction, setDragAction ] = useState(null)

  useEffect(() => {
    const { children } = props.layout

    const totalWidth = children.reduce((total, child) => total + child.width, 0)
    const totalHeight = children.reduce((total, child) => total + child.height, 0)

    // Normalize the values in the long axis in case they sum to grater than 100%
    setViews(children.map((child, childIdx) => {
      const prevChild = children[childIdx - 1]
      const nextChild = children[childIdx + 1]

      const childNeighbors = props.isVertical ? {
        ...props.neighbors,
        [POSITION.top]: prevChild || props.neighbors[POSITION.top],
        [POSITION.bottom]: nextChild || props.neighbors[POSITION.bottom],
      } : {
        ...props.neighbors,
        [POSITION.left]: prevChild || props.neighbors[POSITION.left],
        [POSITION.right]: nextChild || props.neighbors[POSITION.right],
      }

      return {
        ...child,
        width: !props.isVertical ? ( child.width / totalWidth ) : child.width,
        height: props.isVertical ? ( child.height / totalHeight ) : child.height,
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
    const isResizeVertical = (direction === POSITION.top || direction === POSITION.bottom)

    const isFirstChild = views?.[0].id === id
    const isLastChild = views?.[views.length - 1].id === id

    const isBeyondHorizontalBounds = !props.isVertical && (
      (isFirstChild && direction === POSITION.left) ||
      (isLastChild && direction === POSITION.right)
    )
    const isBeyondVerticalBounds = props.isVertical && (
      (isFirstChild && direction === POSITION.up) ||
      (isLastChild && direction === POSITION.down)
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
      case POSITION.left:
        if (prevView) {
          activeView.width -= sizeDelta.x
          prevView.width += sizeDelta.x
        }
        break

      case POSITION.right:
        if (nextView) {
          activeView.width += sizeDelta.x
          nextView.width -= sizeDelta.x
        }
        break

      case POSITION.top:
        if (prevView) {
          activeView.height -= sizeDelta.y
          prevView.height += sizeDelta.y
        }
        break

      case POSITION.bottom:
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

  const renderChildren = () => views?.map(view => {
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
      />
    )
  })

  return (
    <div
      ref={containerRef}
      className={cx(
        styles.controller,
        {
          [styles.vertical]: props.isVertical
        }
      )}
      style={{
        width: decimalToPercent(props.width),
        height: decimalToPercent(props.height),
      }}
      onMouseMove={dragAction === null ? null : onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {renderChildren()}
    </div>
  )
}

ViewController.propTypes = {
  layout: PropTypes.shape({}).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  controllerId: PropTypes.string.isRequired,
  requestResize: PropTypes.func.isRequired,
  neighbors: PropTypes.shape({}),
  isDragged: PropTypes.bool,
  isVertical: PropTypes.bool,
}

ViewController.defaultProps = {
  isVertical: false,
  neighbors: {},
}

export default ViewController
