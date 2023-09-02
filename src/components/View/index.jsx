import React, { useState, useRef, useCallback } from 'react'
// import PropTypes from 'prop-types'

import { DIRECTION } from 'shared/utils/constants'
import SizeControl from 'components/SizeControl'

import styles from './styles.scss'

const HOVER_DELAY = 200 // ms

function View({
  viewId,
  width,
  height,
  neighbors,
  isDragged,
  requestResize,
  requestInsertion,
  component,
  ...otherProps
}) {
  const containerRef = useRef()
  const controlHoverTimeout = useRef(null)

  const [ activeControl, setActiveControl ] = useState(null)

  // TODO: This should not be percentage based (small view = tiny region size)
  const getControlRegions = (container, mouseX, mouseY, options = { regionSize: 30 }) => {
    const mouseOffset = {
      x: (mouseX - container.offsetLeft), // container.offsetWidth,
      y: (mouseY - container.offsetTop) // container.offsetHeight,
    }
    const activeRegions = {
      [DIRECTION.left]:   mouseOffset.x < options.regionSize,
      [DIRECTION.top]:    mouseOffset.y < options.regionSize,
      [DIRECTION.right]:  container.offsetWidth - mouseOffset.x < options.regionSize,
      [DIRECTION.bottom]: container.offsetHeight - mouseOffset.y < options.regionSize,
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

  const waitForControlHover = (control) => {
    controlHoverTimeout.current = setTimeout(() => {
      setActiveControl(control)
    }, HOVER_DELAY)
  }

  const clearControlHover = () => {
    clearTimeout(controlHoverTimeout.current)
    controlHoverTimeout.current = null
  }

  const clearActiveControl = () => {
    if (!isDragged) {
      setActiveControl(null)
    }
  }

  const resizeView = useCallback(({ mouseX, mouseY, direction }) => {
    if (!isDragged && activeControl) {
      requestResize({
        id: viewId,
        direction,
        origin: { x: mouseX, y: mouseY }
      })
    }
  }, [
    activeControl,
    viewId,
    isDragged,
    requestResize,
  ])

  const createView = useCallback(({ direction }) => {
    requestInsertion({ id: viewId, direction })
  }, [
    viewId,
    requestInsertion,
  ])

  const onMouseMove = ({ clientX, clientY }) => {
    const controlRegions = getControlRegions(containerRef.current, clientX, clientY)
    const newActiveControl = filterControlRegions(controlRegions)

    if (!isDragged && activeControl !== newActiveControl) {
      clearControlHover()

      if (newActiveControl != null) {
        waitForControlHover(newActiveControl)
      } else {
        clearActiveControl()
      }
    } else if (newActiveControl === null && controlHoverTimeout.current != null) {
      clearControlHover()
    }
  }

  const onMouseLeave = () => {
    clearControlHover()
    clearActiveControl()
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
        onLeave={clearActiveControl}
      />
      <div className={styles.content}>{component}</div>
    </div>
  )
}

export default View;