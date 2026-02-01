import { RouterProvider } from '@tanstack/react-router'
import React from 'react'

import { mainRouter } from './routes/route'

const App: React.FC = () => {
  return <RouterProvider router={mainRouter} />
}

export default App
