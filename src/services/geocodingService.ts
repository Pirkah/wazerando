export interface GeocodingResult {
  id: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  type: string;
}

/**
 * Service de géocodage d'adresses et de lieux utilisant OpenStreetMap Nominatim
 * Gratuit, mondial, sans clé API.
 */
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const encoded = encodeURIComponent(query.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=fr&limit=6&addressdetails=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((item: any) => {
      const address = item.address || {};
      const street = address.road || address.pedestrian || address.suburb || '';
      const city = address.city || address.town || address.village || address.municipality || '';
      const shortName = street ? `${street}${city ? `, ${city}` : ''}` : item.display_name.split(',')[0];

      return {
        id: `geo-${item.place_id}`,
        displayName: item.display_name,
        shortName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || 'place',
      };
    });
  } catch (err) {
    console.warn('Erreur lors de la recherche d\'adresse Nominatim:', err);
    return [];
  }
}
