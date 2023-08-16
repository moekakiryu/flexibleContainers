import React, { useState, useRef } from 'react'
// import PropTypes from 'prop-types'
import _pickBy from 'lodash/pickBy'
import _keys from 'lodash/keys'
import SizeControl, { POSITION } from "../SizeControl"

import styles from './styles.scss'

function View({
  width,
  height,
  isDragged,
  requestResize,
  viewId,
  ...otherProps
}) {
  const containerRef = useRef()
  const [ activeControl, setActiveControl ] = useState(null)

  // TODO: This should not be percentage based (small view = tiny region size)
  const getControlRegions = (container, mouseX, mouseY, options = { regionSize: 0.05 }) => {
    const mouseOffset = {
      x: (mouseX - container.offsetLeft) / container.offsetWidth,
      y: (mouseY - container.offsetTop) / container.offsetHeight,
    }

    const activeRegions = {
      [POSITION.left]:   mouseOffset.x < options.regionSize,
      [POSITION.top]:    mouseOffset.y < options.regionSize,
      [POSITION.right]:  1 - mouseOffset.x < options.regionSize,
      [POSITION.bottom]: 1 - mouseOffset.y < options.regionSize,
    }

    return activeRegions
  }

  const filterControlRegions = regions => {
    const activeRegions = _pickBy(regions, (isActive, position) => isActive)

    return _keys(activeRegions)[0]
  }

  const onMouseMove = ({ clientX, clientY }) => {
    const controlRegions = getControlRegions(containerRef.current, clientX, clientY)
    const newActiveControl = filterControlRegions(controlRegions) || null

    // IMPORTANT: Page components can NOT be children of this component or else they will ALWAYS re-render on mouse move
    //            Use an alternate method to render them or use shouldComponentUpdate
    if (!isDragged && activeControl !== newActiveControl) {
      setActiveControl(newActiveControl)
    }
  }

  const onMouseDown = ({ clientX, clientY }) => {
    if (activeControl) {
      requestResize({
        id: viewId,
        direction: activeControl,
        origin: {
          x: clientX,
          y: clientY,
        }
      })
    }
  }

  const onMouseLeave = () => {
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
        minHeight: `${height * 100}%`,
      }}
      draggable={false}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      {...otherProps}
    >
      <SizeControl position={activeControl} />
      <div className={styles.content} />
    </div>
  )
}

export default View;