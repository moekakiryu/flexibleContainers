import React from "react";
import cx from "classnames";

import styles from './styles.scss'

export const POSITION = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
}

function SizeControl({ position }) {
  // Note: Below we could create a mapping from POSITION values to their
  //       matching styles. While that would be more concise, this has the
  //       benefit of being readable at a glance (unlike this comment)
  const sizeControl = (
    <span
      className={cx(
        styles.sizeControl,
        {
          [styles.top]:    position === POSITION.top,
          [styles.bottom]: position === POSITION.bottom,
          [styles.left]:   position === POSITION.left,
          [styles.right]:  position === POSITION.right,
        }
      )}
    />
  )

  return (
    <React.Fragment>
      {!!position && sizeControl}
    </React.Fragment>
  )
}

export default SizeControl