import React, { useState } from "react";
import _find from 'lodash/find'

import View from './View'
import { POSITION } from "./SizeControl";

import styles from './styles.scss'

const defaultViews = [
  {
    id: 'v1',
    width: (1/3),
    height: 1,
  },
  {
    id: 'v2',
    width: (1/3),
    height: 1,
  },
  {
    id: 'v3',
    width: (1/3),
    height: 1,
  }
]

function ViewController() {
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
      y: clientY - dragOrigin.y,
    }

    const activeView = _find(views, { id: activeViewId })
    const nextView = views[views.indexOf(activeView) + 1]
    const prevView = views[views.indexOf(activeView) - 1]

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
        // TODO
        break

      case POSITION.bottom:
        // TODO
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
      className={styles.controller}
      onMouseMove={resizeActiveView}
      onMouseUp={clearDragAction}
      onMouseLeave={clearDragAction}
    >
      {views.map((view, colIdx) => {
        const nextView = views[colIdx + 1]
        const prevView = views[colIdx - 1]

        return (
          <View
            width={view.width}
            height={view.height}
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