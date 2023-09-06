import React, { useState, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import _noop from 'lodash/noop'

import { DIRECTION } from 'shared/utils/directions'
import SizeControl from 'components/SizeControl'

import styles from './styles.scss'

const HOVER_DELAY = 100 // ms

function View({
  width,
  height,
  neighbors,
  isDragged,
  requestResize,
  requestInsertion,
  requestDeletion,
  component,
}) {
  const containerRef = useRef()
  const controlHoverTimeout = useRef(null)

  const [activeControl, setActiveControl] = useState(null)

  const getControlRegions = (
    container,
    mouseX,
    mouseY,
    options = { enterSize: 15, exitSize: 60 },
  ) => {
    const mouseOffset = {
      x: (mouseX - container.offsetLeft),
      y: (mouseY - container.offsetTop),
    }
    const regionSize = activeControl ? options.exitSize : options.enterSize

    return [
      (mouseOffset.x < regionSize) && DIRECTION.left,
      (mouseOffset.y < regionSize) && DIRECTION.top,
      (container.offsetWidth - mouseOffset.x < regionSize) && DIRECTION.right,
      (container.offsetHeight - mouseOffset.y < regionSize) && DIRECTION.bottom,
    ]
  }

  const filterControlRegions = (regions) => (
    regions.filter((region) => !!neighbors[region])[0] || null
  )

  const waitForControlHover = (control) => {
    controlHoverTimeout.current = setTimeout(() => {
      setActiveControl(control)
    }, HOVER_DELAY)
  }

  const clearControlHover = () => {
    clearTimeout(controlHoverTimeout.current)
    controlHoverTimeout.current = null
  }

  const resizeView = useCallback(({ mouseX, mouseY }) => {
    if (!isDragged && activeControl) {
      requestResize({
        direction: activeControl,
        origin: { x: mouseX, y: mouseY },
      })
    }
  }, [
    activeControl,
    isDragged,
    requestResize,
  ])

  const createView = useCallback(() => {
    setActiveControl(null)
    requestInsertion({ direction: activeControl })
  }, [
    requestInsertion,
  ])

  const deleteView = useCallback(() => {
    requestDeletion({ direction: activeControl })
  }, [
    requestDeletion,
  ])

  const onMouseMove = ({ clientX, clientY }) => {
    const controlRegions = getControlRegions(containerRef.current, clientX, clientY)
    const newActiveControl = filterControlRegions(controlRegions)

    if (!isDragged && activeControl !== newActiveControl) {
      clearControlHover()

      if (newActiveControl != null) {
        waitForControlHover(newActiveControl)
      } else {
        setActiveControl(null)
      }
    } else if (newActiveControl === null && controlHoverTimeout.current != null) {
      // If the user hovers over a control, then moves away before `activeControl` is set
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
        width: `${width * 100}%`,
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
        onDelete={deleteView}
      />
      <div className={styles.content}>{component}</div>
    </div>
  )
}

View.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  neighbors: PropTypes.shape({}),
  isDragged: PropTypes.bool,
  requestResize: PropTypes.func,
  requestInsertion: PropTypes.func,
  requestDeletion: PropTypes.func,
  component: PropTypes.elementType,
}

View.defaultProps = {
  neighbors: [],
  isDragged: false,
  requestResize: _noop,
  requestInsertion: _noop,
  requestDeletion: _noop,
  component: null,
}

export default View
