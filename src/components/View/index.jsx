import React, { useState, useRef } from "react"
import _pickBy from 'lodash/pickBy'
import _keys from 'lodash/keys'
import _head from 'lodash/head'

import SizeControl, { POSITION } from "./SizeControl"

import styles from './styles.scss'

const getHoverRegions = (container, mouseX, mouseY, options = { regionPercent: 0.05 }) => {
    const {
        offsetTop: containerTop,
        offsetLeft: containerLeft,
        offsetWidth: containerWidth,
        offsetHeight: containerHeight
    } = container

    const offsetX = mouseX - containerLeft;
    const offsetY = mouseY - containerTop;

    const regionWidth = containerWidth * options.regionPercent;
    const regionHeight = containerHeight * options.regionPercent;

    const activeRegions = {
        [POSITION.left]:   offsetX < regionWidth,
        [POSITION.top]:    offsetY < regionHeight,
        [POSITION.bottom]: (containerHeight - offsetY) < regionHeight,
        [POSITION.right]:  (containerWidth - offsetX) < regionWidth,
    }

    return activeRegions
}

function View() {
    const [activeRegion, setActiveRegion] = useState(null)
    const containerRef = useRef()

    const onMouseMove = evt => {
        const regions = getHoverRegions(containerRef.current, evt.clientX, evt.clientY)

        const activeRegions = _pickBy(regions, (v,k) => v)
        const firstActive = _head(_keys(activeRegions))

        setActiveRegion(firstActive || null)

    }

    const onMouseLeave = () => setActiveRegion(null)

    return (
        <div
            ref={containerRef}
            className={styles.view}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
        >
            <SizeControl
                isVisible={!!activeRegion}
                position={activeRegion}
            />
            <div className={styles.content}>
            </div>
        </div>
    )
}

export default View;