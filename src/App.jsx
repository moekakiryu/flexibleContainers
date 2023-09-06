import React from 'react'

import ViewController from 'components/ViewController'

const defaultLayout = {
  children: [
    {
      id: 'c1/v',
      width: (1 / 4),
      height: 1,
    },
    {
      id: 'c2',
      width: (1 / 2),
      height: 1,
      children: [
        {
          id: 'c2r1/v',
          width: 1,
          height: (1 / 3),
        },
        {
          id: 'c2r2/v',
          width: 1,
          height: (5 / 12),
        },
        {
          id: 'c2r3/v',
          width: 1,
          height: (1 / 4),
        },
      ],
    },
    {
      id: 'c3',
      width: (1 / 4),
      height: 1,
      children: [
        {
          id: 'c3r1',
          width: 1,
          height: (1 / 4),
          children: [
            {
              id: 'c3r1c1/v',
              width: (1 / 2),
              height: 1,
            },
            {
              id: 'c3r1c2/v',
              width: (1 / 2),
              height: 1,
            },
          ],
        },
        {
          id: 'c3r2/v',
          width: 1,
          height: (3 / 4),
        },
      ],
    },
  ],
}

// eslint-disable-next-line no-unused-vars
const debugLayout = {
  children: [
    {
      id: 'c1',
      width: (1 / 4),
      height: 1,
      children: [
        {
          id: 'r1',
          width: 1,
          height: (1 / 3),
        },
        {
          id: 'r2',
          width: 1,
          height: (1 / 3),
        },
        {
          id: 'r3',
          width: 1,
          height: (1 / 3),
        },
      ],
    },
    {
      id: 'c2',
      width: (3 / 4),
      height: 1,
    },
  ],
}

function App() {
  return (
    <>
      <style>
        {`
          #root {
            height: 100vh;
          }
        `}
      </style>
      <ViewController
        controllerId="root"
        initialLayout={defaultLayout}
      />
    </>
  )
}

export default App
