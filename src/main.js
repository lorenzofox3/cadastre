import './style.css';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import * as maptilersdk from '@maptiler/sdk';
import { union, featureCollection, buffer, difference } from '@turf/turf';

maptilersdk.config.apiKey = '<API_KEY>';
const map = new maptilersdk.Map({
  container: 'map', // container's id or the HTML element to render the map
  style: maptilersdk.MapStyle.HYBRID,
  center: [5.6770271, 43.52602],
  zoom: 18,
});

map.on('load', () => {
  map.addSource('cadastre', {
    type: 'geojson',
    data: '/data/parcelles.json',
    promoteId: 'id',
  });

  map.addSource('limit-overlay', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  map.addLayer({
    id: 'parcelles-fill',
    type: 'fill',
    source: 'cadastre',
    paint: {
      'fill-color': '#4b92d8',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.6,
        0.3,
      ],
    },
  });

  map.addLayer({
    id: 'overlay-fill',
    type: 'fill',
    source: 'limit-overlay',
    paint: {
      'fill-color': 'red',
      'fill-opacity': 0.3,
    },
  });

  map.addLayer({
    id: 'parcelles-countours',
    type: 'line',
    source: 'cadastre',
    paint: {
      'line-color': '#4b92d8',
    },
  });

  map.addLayer({
    id: 'labels',
    type: 'symbol',
    source: 'cadastre',
    minzoom: 18,
    layout: {
      'text-field': ['concat', ['get', 'section'], '-', ['get', 'numero']],
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
    },
  });

  map.on('click', 'parcelles-fill', function (e) {
    const featureId = e.features?.at(0)?.properties?.id;
    if (featureId) {
      const features = map.querySourceFeatures('cadastre', {
        filter: ['==', ['get', 'id'], featureId],
      });
      const combinedPolygon =
        features.length >= 2
          ? union(featureCollection(features))
          : features.at(0);

      const insetPolygon = buffer(combinedPolygon, -4, { units: 'meters' });
      const ringPolygon = insetPolygon
        ? difference(featureCollection([combinedPolygon, insetPolygon]))
        : combinedPolygon;

      const geoJSON = {
        type: 'FeatureCollection',
        features: [ringPolygon],
      };
      map.getSource('limit-overlay').setData(geoJSON);
    }
  });

  let hoverId;

  map.on('mousemove', 'parcelles-fill', (e) => {
    const featureId = e.features?.at(0)?.id;
    if (featureId) {
      if (hoverId) {
        map.setFeatureState(
          {
            source: 'cadastre',
            id: hoverId,
          },
          {
            hover: false,
          },
        );
      }
      hoverId = featureId;
      map.getCanvas().style.cursor = 'pointer';
      map.setFeatureState(
        {
          source: 'cadastre',
          id: featureId,
        },
        {
          hover: true,
        },
      );
    }
  });

  map.on('mouseleave', 'parcelles-fill', (e) => {
    if (hoverId) {
      map.getCanvas().style.cursor = '';
      map.setFeatureState(
        {
          source: 'cadastre',
          id: hoverId,
        },
        {
          hover: false,
        },
      );
      hoverId = undefined;
    }
  });
});
