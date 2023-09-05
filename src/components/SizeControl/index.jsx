import React, { useRef } from "react";
import PropTypes from 'prop-types'
import cx from "classnames";
import _noop from 'lodash/noop'

import { DIRECTION } from "shared/utils";
import { ReactComponent as PlusIcon } from 'static/iconmonstr-plus-lined.svg'
import { ReactComponent as CrossIcon } from 'static/iconmonstr-x-mark-lined.svg'

import styles from './styles.scss'

function SizeControl({ position, onLeave, onResize, onCreate, onDelete }) {
  // we don't need to re-render for any of these values
  const hasClickPending = useRef(false)

  const onMouseDown = ({ clientX, clientY }) => {
    hasClickPending.current = true

    onResize({
      mouseX: clientX,
      mouseY: clientY,
    })
  }

  const onMouseMove = () => {
    if (hasClickPending.current) {
      hasClickPending.current = false
    }
  }

  const onCreateButtonClick = ({ clientX, clientY }) => {
    if (hasClickPending.current) {
      onCreate({
        mouseX: clientX,
        mouseY: clientY,
      })
    }
  }

  const onDeleteButtonClick = ({ clientX, clientY} ) => {
    if (hasClickPending.current) {
      onDelete({
        mouseX: clientX,
        mouseY: clientY,
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
        onClick={onCreateButtonClick}
      >
        <PlusIcon />
      </button>
      <button
        type="button"
        className={styles.addButton}
        onClick={onDeleteButtonClick}
      >
        <CrossIcon style={{fill: 'red'}} />
      </button>

    </span>
  )

  return (
    <React.Fragment>
      {!!position && sizeControl}
    </React.Fragment>
  )
}

SizeControl.propTypes = {
  position: PropTypes.string,
  onLeave: PropTypes.func,
  onResize: PropTypes.func,
  onCreate: PropTypes.func,
  onDelete: PropTypes.func,
}

SizeControl.defaultProps = {
  position: null,
  onLeave: _noop,
  onResize: _noop,
  onCreate: _noop,
  onDelete: _noop,
}


export default SizeControl