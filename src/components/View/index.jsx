import React, { useState, useRef } from 'react'
// import PropTypes from 'prop-types'

import { DIRECTION } from 'shared/utils/constants'
import SizeControl from 'components/SizeControl'

import styles from './styles.scss'

const HOVER_DELAY = 350 // ms

function View({
  width,
  height,
  neighbors,
  isDragged,
  requestResize,
  requestInsertion,
  viewId,
  component,
  ...otherProps
}) {
  const containerRef = useRef()
  const controlHoverTimeout = useRef(null)

  const [ activeControl, setActiveControl ] = useState(null)

  // TODO: This should not be percentage based (small view = tiny region size)
  const getControlRegions = (container, mouseX, mouseY, options = { regionSize: 0.05 }) => {
    const mouseOffset = {
      x: (mouseX - container.offsetLeft) / container.offsetWidth,
      y: (mouseY - container.offsetTop) / container.offsetHeight,
    }

    const activeRegions = {
      [DIRECTION.left]:   mouseOffset.x < options.regionSize,
      [DIRECTION.top]:    mouseOffset.y < options.regionSize,
      [DIRECTION.right]:  1 - mouseOffset.x < options.regionSize,
      [DIRECTION.bottom]: 1 - mouseOffset.y < options.regionSize,
    }

    return activeRegions
  }

  /**
   * @param {*} regions A key/value boolean mapping
   * @returns The name of a true property or undefined
   */
  const filterControlRegions = regions => {
    for (const [region, isActive] of Object.entries(regions)) {
      if (isActive && !!neighbors[region]) {
        return region
      }
    }
    return null
  }

  const clearControlHover = () => {
    clearTimeout(controlHoverTimeout.current)
    controlHoverTimeout.current = null
  }

  const resizeView = ({ mouseX, mouseY, direction }) => {
    if (!isDragged && activeControl) {
      requestResize({
        id: viewId,
        direction,
        origin: { x: mouseX, y: mouseY }
      })
    }
  }

  const createView = ({ direction }) => {
    requestInsertion({ id: viewId, direction })
  }

  const onMouseMove = ({ clientX, clientY }) => {
    const controlRegions = getControlRegions(containerRef.current, clientX, clientY)
    const newActiveControl = filterControlRegions(controlRegions)

    if (!isDragged && activeControl !== newActiveControl) {
      clearControlHover()

      if (newActiveControl != null) {
        controlHoverTimeout.current = setTimeout(() => {
          setActiveControl(newActiveControl)
        }, HOVER_DELAY)
      } else {
        setActiveControl(null)
      }
    } else if (newActiveControl === null && controlHoverTimeout.current != null) {
      clearControlHover()
    }
  }

  const onMouseLeave = () => {
    clearControlHover()
    if (!isDragged) {
      setActiveControl(null)
    }
  }

  // TODO: Otherprops should be passed to the viewed component
  return (
    <div
      ref={containerRef}
      className={styles.view}
      style={{
        width:  `${width * 100}%`,
        height: `${height * 100}%`,
      }}
      draggable={!activeControl}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...otherProps}
    >
      <SizeControl
        position={activeControl}
        onCreate={createView}
        onResize={resizeView}
      />
      <div className={styles.content}>{component}</div>
    </div>
  )
}

export default View;