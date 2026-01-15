
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Botanique from '../Botanique'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '../../services/api'

// Mock the API module
vi.mock('../../services/api', () => ({
    fetchBotaniqueInfo: vi.fn(),
    getSavedPlants: vi.fn(),
    savePlant: vi.fn(),
    deletePlant: vi.fn()
}))

describe('Botanique Screen', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        // Default mock returns empty list
        api.getSavedPlants.mockResolvedValue([])
    })

    it('renders correctly', async () => {
        render(<Botanique />)
        expect(screen.getByText('Agent Botanique')).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Tomate Marmande/i)).toBeInTheDocument()
    })

    it('displays saved plants', async () => {
        const mockPlants = [
            { id: '1', nom_commun: 'Basilic', espece: 'Ocimum basilicum', variete: 'Grand Vert' }
        ]
        api.getSavedPlants.mockResolvedValue(mockPlants)

        render(<Botanique />)

        await waitFor(() => {
            expect(screen.getByText('Basilic')).toBeInTheDocument()
            expect(screen.getByText('Grand Vert')).toBeInTheDocument()
        })
    })

    it('performs searches via API', async () => {
        const user = userEvent.setup()
        const mockResult = {
            taxonomie: { nom_commun: 'Tomate', genre: 'Solanum', espece: 'lycopersicum' },
            calendrier: { semis_sous_abri: [], semis_pleine_terre: [], recolte: [], floraison: [] },
            caracteristiques: { saveur: 'Sucrée', couleur: 'Rouge' },
            cycle_vie: { type: 'ANNUELLE' },
            categorisation: { categorie: 'Legume' }
        }
        api.fetchBotaniqueInfo.mockResolvedValue(mockResult)

        render(<Botanique />)

        const input = screen.getByPlaceholderText(/Tomate Marmande/i)
        await user.type(input, 'Tomate')

        const button = screen.getByRole('button', { name: /Rechercher/i })
        await user.click(button)

        await waitFor(() => {
            expect(screen.getByText('Tomate')).toBeInTheDocument()
            expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument()
        }, { onTimeout: (e) => { screen.debug(); return e; } })

        expect(api.fetchBotaniqueInfo).toHaveBeenCalledWith('Tomate')
    })
})
