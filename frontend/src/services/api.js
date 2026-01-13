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

        return await response.json(); // Returns { data: {...}, usage: {...} }
    } catch (error) {
        console.error('Error fetching botanique info:', error);
        throw error;
    }
};

/**
 * Sauvegarde une plante en base
 */
export const savePlant = async (plantData) => {
    const response = await fetch(`${API_BASE_URL}/botanique/plantes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(plantData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur sauvegarde");
    }
    return await response.json();
};

/**
 * Récupère la liste des plantes sauvegardées
 */
export const getSavedPlants = async () => {
    const response = await fetch(`${API_BASE_URL}/botanique/plantes`);
    if (!response.ok) throw new Error("Erreur chargement plantes");
    return await response.json();
};

/**
 * Supprime une plante
 */
export const deletePlant = async (id) => {
    const response = await fetch(`${API_BASE_URL}/botanique/plantes/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error("Erreur suppression");
    return true;
};
