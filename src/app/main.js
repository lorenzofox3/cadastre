import './style.css';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import * as maptilersdk from '@maptiler/sdk';
import { createStore } from './store.js';

maptilersdk.config.apiKey = '<API KEY>';
const map = new maptilersdk.Map({
  container: 'map', // container's id or the HTML element to render the map
  style: maptilersdk.MapStyle.HYBRID,
  center: [5.6770271, 43.52602],
  zoom: 18,
});

map.on('load', () => {
  const store = createStore({ map });

  map.addSource('cadastre', {
    type: 'geojson',
    data: '/data/lands.json',
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
    id: 'lands-fill',
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
    id: 'lands-countours',
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

  store.addEventListener('landSelected', (event) => {
    const { selectedLand } = store.getState();
    map.getSource('limit-overlay').setData(selectedLand.ringGeoJSON);
  });

  store.addEventListener('landHighlighted', ({ detail }) => {
    const canvas = map.getCanvas();
    const { oldLandId, newLandId } = detail;

    if (oldLandId) {
      map.setFeatureState(
        {
          source: 'cadastre',
          id: oldLandId,
        },
        {
          hover: false,
        },
      );
      map.getCanvas().style.cursor = '';
    }

    if (newLandId) {
      map.setFeatureState(
        {
          source: 'cadastre',
          id: newLandId,
        },
        {
          hover: true,
        },
      );
      canvas.style.cursor = 'pointer';
    }
  });

  map.on('click', 'lands-fill', function (e) {
    const landId = e.features?.at(0)?.properties?.id;
    store.selectLand({ landId });
  });

  map.on('mousemove', 'lands-fill', (e) => {
    const landId = e.features?.at(0)?.id;
    store.highlightLand({ landId });
  });

  map.on('mouseleave', 'lands-fill', (e) => {
    store.highlightLand({
      landId: undefined,
    });
  });
});
