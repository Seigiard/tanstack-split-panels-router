import React from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { mainRouter } from './routes/route'

const App: React.FC = () => {
  return <RouterProvider router={mainRouter} />
}

export default App
