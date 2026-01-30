import React from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { mainRouter } from './routes/main'

const App: React.FC = () => {
  return <RouterProvider router={mainRouter} />
}

export default App
