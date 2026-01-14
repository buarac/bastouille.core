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
 * Met à jour une plante
 */
export const updatePlant = async (id, data) => {
    // data is the full JSON object (ReponseBotanique)
    const response = await fetch(`${API_BASE_URL}/botanique/plantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erreur lors de la mise à jour");
    }
    return response.json();
};

/**
 * Supprime une plante
 */
export const deletePlant = async (id) => {
    const response = await fetch(`${API_BASE_URL}/botanique/plantes/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
    }
    return true;
};

/**
 * Récupère les métadonnées de l'agent (version)
 */
export const fetchAgentMeta = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/agents/botanique/meta`);
        if (!response.ok) return { version: "1.0" }; // Fallback
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch agent meta", err);
        return { version: "1.0" };
    }
};

/**
 * Récupère les logs d'activité des agents
 */
export const fetchAgentLogs = async (limit = 50, offset = 0) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/logs?limit=${limit}&offset=${offset}`);
        if (!response.ok) throw new Error("Failed to fetch logs");
        return await response.json();
    } catch (error) {
        console.error("Error fetching agent logs:", error);
        return [];
    }
};
/**
 * Récupère le référentiel des gestes
 * @param {string|null} famille - Filtre optionnel par famille
 */
export const fetchGestes = async (famille = null) => {
    let url = `${API_BASE_URL}/referentiel/gestes`;
    if (famille) {
        url += `?famille=${encodeURIComponent(famille)}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur chargement gestes");
    return await response.json();
};

/**
 * Récupère la liste des familles de gestes
 */
export const fetchFamillesGestes = async () => {
    const response = await fetch(`${API_BASE_URL}/referentiel/gestes/familles`);
    if (!response.ok) throw new Error("Erreur chargement familles");
    const json = await response.json();
    return json.familles;
};
