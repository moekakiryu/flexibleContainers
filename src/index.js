import React from 'react'
import ReactDOM from 'react-dom/client'

import 'shared/styles/main.scss'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(React.createElement(
  React.StrictMode,
  {},
  React.createElement(App),
))
