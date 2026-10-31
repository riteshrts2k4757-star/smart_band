import { geocodeSearch, reverseGeocode, getDirections, getOrsApiKey } from '../services/openRouteService.js';

export async function checkStatus(req, res) {
  const hasKey = !!getOrsApiKey();
  res.json({
    status: 'online',
    service: 'NAVIBAND ORS Proxy',
    orsConnected: hasKey,
    timestamp: new Date().toISOString()
  });
}

export async function searchPlaces(req, res, next) {
  try {
    const { text, size } = req.query;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter "text" is required.' });
    }

    const limit = Math.min(Math.max(parseInt(size, 10) || 5, 1), 10);
    const data = await geocodeSearch(text.trim(), limit);
    
    // Format simplified results for the frontend
    const results = (data.features || []).map(f => ({
      id: f.properties.id || `${f.geometry.coordinates[0]},${f.geometry.coordinates[1]}`,
      label: f.properties.label || f.properties.name || 'Unknown location',
      name: f.properties.name,
      country: f.properties.country,
      region: f.properties.region,
      locality: f.properties.locality,
      coordinates: f.geometry.coordinates // [lon, lat]
    }));

    res.json({
      success: true,
      features: results
    });
  } catch (error) {
    next(error);
  }
}

export async function reverseSearch(req, res, next) {
  try {
    const lon = parseFloat(req.query.lon);
    const lat = parseFloat(req.query.lat);

    if (isNaN(lon) || isNaN(lat)) {
      return res.status(400).json({ error: 'Valid "lon" and "lat" query parameters are required.' });
    }

    const address = await reverseGeocode(lon, lat);
    res.json({
      success: true,
      label: address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`
    });
  } catch (error) {
    next(error);
  }
}

export async function calculateRoute(req, res, next) {
  try {
    const { coordinates, profile } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        error: 'Invalid request: "coordinates" array with at least two [lon, lat] points is required.'
      });
    }

    const routeData = await getDirections(coordinates, profile || 'driving-car');
    res.json(routeData);
  } catch (error) {
    next(error);
  }
}

