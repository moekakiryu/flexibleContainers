import React, { useState, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import _noop from 'lodash/noop'

import { DIRECTION } from 'shared/utils/constants'
import SizeControl from 'components/SizeControl'

import styles from './styles.scss'

const HOVER_DELAY = 100 // ms

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
  const getControlRegions = (container, mouseX, mouseY, options = { enterRegion: 15, exitRegion: 60 }) => {
    const mouseOffset = {
      x: (mouseX - container.offsetLeft),
      y: (mouseY - container.offsetTop),
    }
    const regionSize = activeControl ? options.exitRegion : options.enterRegion

    const activeRegions = {
      [DIRECTION.left]:   mouseOffset.x < regionSize,
      [DIRECTION.top]:    mouseOffset.y < regionSize,
      [DIRECTION.right]:  container.offsetWidth - mouseOffset.x < regionSize,
      [DIRECTION.bottom]: container.offsetHeight - mouseOffset.y < regionSize,
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

View.propTypes = {
  viewId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  neighbors: PropTypes.shape({}),
  isDragged: PropTypes.bool,
  requestResize: PropTypes.func,
  requestInsertion: PropTypes.func,
  component: PropTypes.elementType,
}

View.defaultProps = {
  neighbors: [],
  isDragged: false,
  requestResize: _noop,
  requestInsertion: _noop,
  component: null,
}

export default View;