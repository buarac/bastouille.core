const API_BASE_URL = '/api';

/**
 * Interroge l'agent Botanique.
 * @param {string} query - La plante à rechercher.
 * @returns {Promise<Object>} - La réponse JSON structurée.
 */
export const fetchBotaniqueInfo = async (query) => {
    try {
        const response = await fetch(`${API_BASE_URL}/agents/botanique`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            let errorMessage = `API Error: ${response.statusText}`;
            try {
                const errorData = await response.json();
                // FastAPI retourne souvent 'detail', mais on gère aussi 'message'
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
                // Si le body n'est pas du JSON valide, on garde le statusText
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching botanique info:', error);
        throw error;
    }
};
