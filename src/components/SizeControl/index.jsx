import React, { useRef } from "react";
import cx from "classnames";

import { DIRECTION } from "shared/utils/constants";
import { ReactComponent as PlusIcon } from 'static/iconmonstr-plus-lined.svg'

import styles from './styles.scss'

function SizeControl({ position, onLeave, onResize, onCreate, onDelete }) {
  // we don't need to re-render for any of these values
  const hasClickPending = useRef(false)

  const onMouseDown = ({ clientX, clientY }) => {
    hasClickPending.current = true

    onResize({
      mouseX: clientX,
      mouseY: clientY,
      direction: position,
    })
  }

  const onMouseMove = () => {
    if (hasClickPending.current) {
      hasClickPending.current = false
    }
  }

  const onButtonClick = ({ clientX, clientY }) => {
    if (hasClickPending.current) {
      onCreate({
        mouseX: clientX,
        mouseY: clientY,
        direction: position,
      })
    }
  }

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
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onLeave}
      draggable={false}
    >
      <button
        type="button"
        className={styles.addButton}
        onClick={onButtonClick}
      >
        <PlusIcon />
      </button>
    </span>
  )

  return (
    <React.Fragment>
      {!!position && sizeControl}
    </React.Fragment>
  )
}

export default SizeControl