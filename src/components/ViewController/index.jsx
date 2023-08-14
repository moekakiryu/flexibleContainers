import React, { useState } from "react";

import View from './View'

import styles from './styles.scss'

function ViewController() {
    const [ elementWidth, setElementWidth ] = useState(400) // TODO: make the default better
    const [ elementHeight, setElementHeight ] = useState(400) // TODO: make the default better

    const requestResize = ({ id, width: newWidth, height: newHeight }) => {
        newWidth && setElementWidth(newWidth)
        newHeight && setElementHeight(newHeight)
    }

    return (
        <div className={styles.controller}>
            <View
                width={elementWidth}
                height={elementHeight}
                requestResize={requestResize}
            />
        </div>
    )
}

export default ViewController