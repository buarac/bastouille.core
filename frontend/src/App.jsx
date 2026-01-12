import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="max-w-7xl mx-auto p-8 text-center">
      <div className="flex justify-center gap-8 mb-8">
        <a href="https://vite.dev" target="_blank" className="hover:scale-105 transition-transform duration-300">
          <img src={viteLogo} className="h-24 p-6 hover:drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" className="hover:scale-105 transition-transform duration-300">
          <img src={reactLogo} className="h-24 p-6 hover:drop-shadow-[0_0_2em_#61dafbaa]" alt="React logo" />
        </a>
      </div>
      <h1 className="text-5xl font-bold mb-8 text-slate-100">Vite + React + Tailwind v4</h1>
      <div className="p-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700 max-w-md mx-auto">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-500 transition-colors focus:ring-4 focus:ring-indigo-500/30 cursor-pointer"
        >
          count is {count}
        </button>
        <p className="mt-6 text-slate-300">
          Edit <code className="bg-slate-700 px-2 py-1 rounded text-sm">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="mt-8 text-slate-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
