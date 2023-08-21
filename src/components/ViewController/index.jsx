import React, { useEffect, useState, useRef } from "react"
import cx from "classnames"
import _find from 'lodash/find'

import { decimalToPercent } from "shared/utils/units"
import { POSITION } from "./SizeControl";
import View from './View'

import styles from './styles.scss'

function ViewController({
  layout,
  isVertical = false,
  controllerId,
  width,
  height,
}) {
  const containerRef = useRef()

  const [ views, setViews ] = useState()
  const [ dragAction, setDragAction ] = useState(null)

  useEffect(() => {
    const { children } = layout

    setViews(children.map(child => (
      {
        id: child.id,
        width: child.width,
        height: child.height,
        // TODO: Children shouldn't be here
        children: child.children
      }
    )))
  }, [layout])

  const requestResize = ({ id, direction, origin }) => {
    setDragAction({ id, origin, direction })
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

  const renderViewContent = () => {
    // TODO: Use props where possible
    const { children } = layout

    let components = views?.map((view, viewIdx) => {
      const prevView = children[viewIdx - 1]
      const nextView = children[viewIdx + 1]

      if (view.children?.length > 0) {
        return (
          <ViewController
            key={view.id}
            layout={view}
            isVertical={!isVertical}
            controllerId={view.id}
            width={view.width}
          />
        )
      }

      const neighbors = isVertical ? {
        [POSITION.top]: prevView,
        [POSITION.bottom]: nextView,
      } : {
        [POSITION.left]: prevView,
        [POSITION.right]: nextView,
      }

      return (
        <View
          key={view.id}
          viewId={view.id}
          width={view.width}
          height={view.height}
          neighbors={neighbors}
          isDragged={!!dragAction}
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
      {renderViewContent()}
    </div>
  )
}

export default ViewController
