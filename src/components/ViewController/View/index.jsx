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
  ...otherProps
}) {
  const containerRef = useRef()
  const [ activeControl, setActiveControl ] = useState(null)

  const getControlRegions = (container, mouseX, mouseY, options = { regionSize: 0.1 }) => {
    const {
      offsetTop: containerTop,
      offsetLeft: containerLeft,
      offsetWidth: containerWidth,
      offsetHeight: containerHeight
    } = container

    const offsetX = mouseX - containerLeft;
    const offsetY = mouseY - containerTop;

    const regionWidth = containerWidth * options.regionSize;
    const regionHeight = containerHeight * options.regionSize;

    const activeRegions = {
      [POSITION.left]:   offsetX < regionWidth,
      [POSITION.top]:    offsetY < regionHeight,
      [POSITION.bottom]: (containerHeight - offsetY) < regionHeight,
      [POSITION.right]:  (containerWidth - offsetX) < regionWidth,
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
        id: '<view uuid>',
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
      style={{ width, height }}
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