import React from "react";
import cx from "classnames";

import { DIRECTION } from "shared/utils/constants";

import styles from './styles.scss'

function SizeControl({ position }) {
  // Note: Below we could create a mapping from POSITION values to their
  //       matching styles. While that would be more concise, this has the
  //       benefit of being readable at a glance (unlike this comment)
  const sizeControl = (
    <span
      className={cx(
        styles.sizeControl,
        {
          [styles.top]:    position === DIRECTION.top,
          [styles.bottom]: position === DIRECTION.bottom,
          [styles.left]:   position === DIRECTION.left,
          [styles.right]:  position === DIRECTION.right,
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