import React, { useEffect, useState, useRef } from "react"
import cx from "classnames"
import _find from 'lodash/find'

import { decimalToPercent } from "shared/utils/units"
import { POSITION } from "./SizeControl";
import View from './View'

import styles from './styles.scss'

function ViewController({
  layout,
  width,
  height,
  neighbors,
  controllerId,
  // TODO: Rename this or use `props`
  superRequestResize,
  isDragged,
  isVertical = false,
}) {
  const containerRef = useRef()

  const [ views, setViews ] = useState()
  const [ dragAction, setDragAction ] = useState(null)

  useEffect(() => {
    const { children } = layout

    const totalWidth = children.reduce((total, child) => total + child.width, 0)
    const totalHeight = children.reduce((total, child) => total + child.height, 0)

    // Normalize the values in the long axis in case they sum to grater than 100%
    setViews(children.map(child => (
      {
        ...child,
        width: !isVertical ? ( child.width / totalWidth ) : child.width,
        height: isVertical ? ( child.height / totalHeight ) : child.height,
      }
    )))
  }, [layout])

  const requestResize = ({ id, direction, origin }) => {
    const isResizeVertical = (direction === POSITION.top || direction === POSITION.bottom)

    // Resizing should always be done for the long axis so that it aligns with
    // the flex direction. If the resize request is for the short axis, then
    // forward the request to the parent container so that the pattern is
    // maintained.
    if (isVertical !== isResizeVertical) {
      superRequestResize({ id: controllerId, direction, origin})
    // Otherwise handle the request normally
    } else {
      setDragAction({ id, origin, direction })
    }
  }

  const stopResize = () => {
    setDragAction(null)
  }

  const onMouseMove = ({ clientX, clientY }) => {
    // TODO: Look into using requestAnimationFrame for this
    if (!dragAction) {
      return
    }
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

  const renderChildren = () => {
    // TODO: Use props where possible
    const { children } = layout

    let components = views?.map((view, viewIdx) => {
      const prevView = children[viewIdx - 1]
      const nextView = children[viewIdx + 1]

      // TODO: rename this too after changing to props
      // TODO: If next/prev view are undefined, inherit from props instead
      const childNeighbors = isVertical ? {
        ...neighbors,
        [POSITION.top]: prevView,
        [POSITION.bottom]: nextView,
      } : {
        ...neighbors,
        [POSITION.left]: prevView,
        [POSITION.right]: nextView,
      }

      if (view.children?.length > 0) {
        return (
          <ViewController
            key={view.id}
            layout={view}
            width={view.width}
            height={view.height}
            controllerId={view.id}
            neighbors={childNeighbors}
            superRequestResize={requestResize}
            isDragged={!!dragAction || isDragged}
            isVertical={!isVertical}
          />
        )
      }

      return (
        <View
          key={view.id}
          width={view.width}
          height={view.height}
          viewId={view.id}
          neighbors={childNeighbors}
          isDragged={!!dragAction || isDragged}
          requestResize={requestResize}
        />
      )
    })

    return components
  }

  return (
    <div
      ref={containerRef}
      className={cx(
        styles.controller,
        {
          [styles.vertical]: isVertical
        }
      )}
      style={{
        width: decimalToPercent(width),
        height: decimalToPercent(height),
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {renderChildren()}
    </div>
  )
}

export default ViewController
