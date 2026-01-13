const API_BASE_URL = '/api';

/**
 * Interroge l'agent Botanique (IA)
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
            const errorData = await response.json();
            throw new Error(errorData.detail || `Erreur serveur: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching botanique info:', error);
        throw error;
    }
};
