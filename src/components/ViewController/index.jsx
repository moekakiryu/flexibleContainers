import React, { useState } from "react";

import View from './View'
import { POSITION } from "./SizeControl";

import styles from './styles.scss'

function ViewController() {
    const [ elementWidth, setElementWidth ] = useState(400) // TODO: make the default better
    const [ elementHeight, setElementHeight ] = useState(400) // TODO: make the default better

    const [ dragOrigin, setDragOrigin ] = useState(null)
    const [ resizeDirection, setResizeDirection ] = useState(null)

    const requestResize = ({ id, direction, origin }) => {
        // TODO: Update element based on ID
        setDragOrigin(origin)
        setResizeDirection(direction)
    }

    const onMouseMove = ({ clientX, clientY }) => {
        if (!dragOrigin) {
            return
        }
        const isHorizontal = resizeDirection === POSITION.left || resizeDirection === POSITION.right
        const isVertical = resizeDirection === POSITION.top || resizeDirection === POSITION.bottom

        if (isHorizontal) {
            setElementWidth(prevWidth => prevWidth + (clientX - dragOrigin.x))
        } else if (isVertical) {
            setElementHeight(prevHeight => prevHeight + (clientY - dragOrigin.y))
        } else {
            console.error(`Can't resize in unknown direction: '${resizeDirection}'`)
        }

        setDragOrigin({
            x: clientX,
            y: clientY,
        })
    }

    const onMouseUp = () => setDragOrigin(null)

    return (
        <div
            className={styles.controller}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        >
                <View
                    requestResize={requestResize}
                    width={elementWidth}
                    height={elementHeight}
                />
        </div>
    )
}

export default ViewController