import React, { useEffect, useState } from "react"
import cx from "classnames"
import _find from 'lodash/find'

import View from './View'
import { POSITION } from "./SizeControl";

import styles from './styles.scss'


function ViewController({
  layout,
  isVertical = false,
  id,
}) {
  const [ views, setViews ] = useState()

  const [ dragOrigin, setDragOrigin ] = useState(null)
  const [ activeViewId, setActiveViewId ] = useState(null)
  const [ resizeDirection, setResizeDirection ] = useState(null)

  useEffect(() => {
    const { children } = layout

    setViews(children.map(child => (
      {
        id: child.id,
        width: child.width,
        height: child.height,
        children: child.children
      }
    )))
  }, [layout])

  const requestResize = ({ id, direction, origin }) => {
    setDragOrigin(origin)
    setResizeDirection(direction)
    setActiveViewId(id)
  }

  const clearDragAction = () => {
    setActiveViewId(null)
    setDragOrigin(null)
  }

  const onMouseMove = ({ clientX, clientY }) => {
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

  const onMouseUp = () => clearDragAction()
  const onMouseLeave = () => clearDragAction()

  const getViewContent = () => {
    const { children } = layout

    let components = views?.map((child, childIdx) => {
      const prevChild = children[childIdx - 1]
      const nextChild = children[childIdx + 1]

      const neighbors = isVertical ? {
        [POSITION.top]: prevChild,
        [POSITION.bottom]: nextChild,
      } : {
        [POSITION.left]: prevChild,
        [POSITION.right]: nextChild,
      }

      return (
        <View
          key={child.id}
          viewId={child.id}
          width={child.width}
          height={child.height}
          neighbors={neighbors}
          isDragged={!!activeViewId}
          requestResize={requestResize}
          component={child.children?.length > 0 ? (
            <ViewController
              key={child.id}
              layout={child}
              isVertical={!isVertical}
              id={child.id}
            />
          ) : null}
        />
      )
    })

    return components
  }

  return (
    <div
      className={cx(
        styles.controller,
        {
          [styles.vertical]: isVertical
        }
      )}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      { getViewContent() }
    </div>
  )
}

export default ViewController