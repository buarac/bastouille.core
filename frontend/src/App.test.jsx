import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { describe, it, expect } from 'vitest'

describe('App', () => {
    it('renders headline', () => {
        render(<App />)
        const headline = screen.getByText(/Vite \+ React \+ Tailwind v4/i)
        expect(headline).toBeInTheDocument()
    })

    it('increments counter on click', () => {
        render(<App />)
        const button = screen.getByRole('button', { name: /count is 0/i })

        fireEvent.click(button)

        expect(button).toHaveTextContent('count is 1')
    })
})
