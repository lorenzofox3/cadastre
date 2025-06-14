import './style.css';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import * as maptilersdk from '@maptiler/sdk';
import { createStore } from './store.js';
import { decodeState, encodeState } from './utils.js';

maptilersdk.config.apiKey = import.meta.env.VITE_MAP_TILER_API_KEY;

const initialState = decodeState({ url: window.location.href });
const store = createStore({
  initialState,
});
const { map: mapState } = store.getState();

const map = new maptilersdk.Map({
  container: 'map', // container's id or the HTML element to render the map
  style: maptilersdk.MapStyle.HYBRID,
  ...mapState,
});

map.on('load', () => {
  map.addSource('cadastre', {
    type: 'geojson',
    data: '/cadastre/lands.json',
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

  store.on('landSelected', (event) => {
    const { selectedLand } = store.getState();
    map.getSource('limit-overlay').setData(selectedLand.ringGeoJSON);
  });

  store.on('landHighlighted', ({ detail }) => {
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

  map.on('click', 'lands-fill', (e) => {
    const landId = e.features?.at(0)?.properties?.id;
    const features = landId
      ? map.querySourceFeatures('cadastre', {
          filter: ['==', ['get', 'id'], landId],
        })
      : {
          type: 'FeatureCollection',
          features: [],
        };

    store.selectLand({ landId, features });
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

  map.on('moveend', () => {
    store.setCenter({
      center: map.getCenter(),
      zoom: map.getZoom(),
    });
  });

  // todo hook to event instead
  setTimeout(() => {
    if (initialState?.selectedLand?.id) {
      const landId = initialState.selectedLand.id;
      store.selectLand({
        landId,
        features: map.querySourceFeatures('cadastre', {
          filter: ['==', ['get', 'id'], landId],
        }),
      });
    }
  }, 1_000);
});

store.on('mapCenterChanged', () => {
  const state = store.getState();
  window.history.replaceState(state, null, encodeState({ state }));
});

store.on('landSelected', () => {
  const state = store.getState();
  const { state: historyState } = history;
  const historyLandId = historyState?.selectedLand?.id;
  if (state?.selectedLand?.id !== historyLandId) {
    window.history.pushState(state, null, encodeState({ state })); // todo push store state ?
  }
});
