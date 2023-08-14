import React, { useState, useRef } from 'react'
// import PropTypes from 'prop-types'
import _pickBy from 'lodash/pickBy'
import _keys from 'lodash/keys'
import SizeControl, { POSITION } from "../SizeControl"

import styles from './styles.scss'

class View extends React.Component {
    state = {
        activeControl: null,
    }

    constructor(props) {
        super(props)

        this.containerRef = React.createRef(null)
    }

    onMouseMove = ({ clientX, clientY }) => {
        const { isDragged } = this.props
        const { activeControl } = this.state

        const controlRegions = this.getControlRegions(this.containerRef.current, clientX, clientY)
        const newActiveControl = this.filterControlRegions(controlRegions) || null

        // IMPORTANT: Page components can NOT be children of this component or else they will ALWAYS re-render on mouse move
        // NOTE: (to self) this isn't ideal for performance both because we're updating these
        //                 on every mouse move event, but also because we're updating both
        //                 this components state, AND the parent component which in turn 
        //                 updates this component's props, forcing a double render for every
        //                 single mouse move event
        if (!isDragged && activeControl !== newActiveControl) {
            this.setState({ activeControl: newActiveControl })
        }
    }

    onMouseDown = ({ clientX, clientY }) => {
        const { requestResize } = this.props
        const { activeControl } = this.state

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

    onMouseLeave = () => {
        const { isDragged } = this.props

        if (!isDragged) {
            this.setState({
                activeControl: null,
            })
        }
    }

    getControlRegions = (container, mouseX, mouseY, options = { regionSize: 0.1 }) => {
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

    filterControlRegions = regions => {
        const activeRegions = _pickBy(regions, (isActive, position) => isActive)
        
        return _keys(activeRegions)[0]
    }

    render() {
        const {
            width,
            height,
            isDragged,
            requestResize,
            ...otherProps
        } = this.props
        const { activeControl } = this.state

        return (
            <div
                ref={this.containerRef}
                className={styles.view}
                onMouseMove={this.onMouseMove}
                onMouseLeave={this.onMouseLeave}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                style={{ width, height }}
                {...otherProps}
            >
                <SizeControl
                    isVisible={!!activeControl}
                    position={activeControl}
                />
                <div className={styles.content}>
                </div>
            </div>
        )
    }
}

export default View;