import React, { useState } from "react"
import cx from "classnames"
import _find from 'lodash/find'

import View from './View'
import { POSITION } from "./SizeControl";

import styles from './styles.scss'

const defaultViews = [
  {
    id: 'v1',
    width: (1/3),
    height: (1/3),
  },
  {
    id: 'v2',
    width: (1/3),
    height: (1/3),
  },
  {
    id: 'v3',
    width: (1/3),
    height: (1/3),
  }
]

function ViewController({ isVertical = false }) {
  const [ views, setViews ] = useState(defaultViews)

  const [ dragOrigin, setDragOrigin ] = useState(null)
  const [ activeViewId, setActiveViewId ] = useState(null)
  const [ resizeDirection, setResizeDirection ] = useState(null)

  const requestResize = ({ id, direction, origin }) => {
    setDragOrigin(origin)
    setResizeDirection(direction)
    setActiveViewId(id)
  }

  const resizeActiveView = ({ clientX, clientY }) => {
    if (!dragOrigin || !activeViewId) {
      return
    }
    // TODO: Fix bug where sum of all widths > screen width (currently left to browser implementation, but it should prevent resize)
    const sizeDelta = {
      x: (clientX - dragOrigin.x) / window.innerWidth,
      y: (clientY - dragOrigin.y) / window.innerHeight,
    }

    const activeView = _find(views, { id: activeViewId })
    const prevView = views[views.indexOf(activeView) - 1]
    const nextView = views[views.indexOf(activeView) + 1]

    // TODO: split out U/D/L/R
    switch (resizeDirection) {
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
        console.error(`Can't resize in unknown direction: '${resizeDirection}'`)
    }
    setViews([...views])

    setDragOrigin({
      x: clientX,
      y: clientY,
    })
  }

  const clearDragAction = () => {
    setActiveViewId(null)
    setDragOrigin(null)
  }

  return (
    <div
      className={cx(
        styles.controller,
        {
          [styles.vertical]: isVertical
        }
      )}
      onMouseMove={resizeActiveView}
      onMouseUp={clearDragAction}
      onMouseLeave={clearDragAction}
    >
      {views.map((view, colIdx) => {
        const nextView = views[colIdx + 1]
        const prevView = views[colIdx - 1]

        const neighbors = isVertical ? {
          [POSITION.top]: prevView,
          [POSITION.bottom]: nextView,
        } : {
          [POSITION.left]: prevView,
          [POSITION.right]: nextView,
        }

        return (
          <View
            width={view.width}
            height={view.height}
            neighbors={neighbors}
            isDragged={!!activeViewId}
            requestResize={requestResize}
            viewId={view.id}
            key={view.id}
          />
        )
      })}
    </div>
  )
}

export default ViewController