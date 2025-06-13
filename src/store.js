import { buffer, difference, featureCollection, union } from '@turf/turf';

export const createStore = ({ initialState }) => {
  const eventTarget = new EventTarget();
  const _state = structuredClone(initialState);
  const state = Object.defineProperties(
    {},
    {
      selectedLand: {
        get() {
          const { id: landId, features = [] } = _state.selectedLand;
          return {
            id: landId,
            ringGeoJSON: getRingGeoJSON({ features }),
            properties: features.at(0)?.properties,
          };
        },
        enumerable: true,
      },

      highlightedLand: {
        get() {
          const {
            highlightedLand: { id: highlightedLandId },
          } = _state;
          return {
            landId: highlightedLandId,
          };
        },
      },
      map: {
        get() {
          return structuredClone(_state.map);
        },
        enumerable: true,
      },
    },
  );

  return {
    on(...args) {
      return eventTarget.addEventListener(...args);
    },
    off(...args) {
      return eventTarget.removeEventListener(...args);
    },
    selectLand({ landId, features }) {
      _state.selectedLand = {
        id: landId,
        features,
      };

      eventTarget.dispatchEvent(
        new CustomEvent('landSelected', {
          detail: {
            landId,
          },
        }),
      );
    },
    highlightLand({ landId: newLandId }) {
      const { id: oldLandId } = _state.highlightedLand;
      _state.highlightedLand = { id: newLandId };
      eventTarget.dispatchEvent(
        new CustomEvent('landHighlighted', {
          detail: {
            newLandId,
            oldLandId,
          },
        }),
      );
    },
    setCenter({ center, zoom }) {
      _state.map = {
        ..._state.map,
        center,
        zoom,
      };
      eventTarget.dispatchEvent(
        new CustomEvent('mapCenterChanged', {
          detail: {
            center,
            zoom,
          },
        }),
      );
    },
    getState() {
      return {
        ...state,
      };
    },
  };
};

function getRingGeoJSON({ features, borderSizeMeter = 4 }) {
  if (!features?.length) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const combinedPolygon =
    features.length >= 2 ? union(featureCollection(features)) : features.at(0);

  const insetPolygon = buffer(combinedPolygon, -borderSizeMeter, {
    units: 'meters',
  });
  const ringPolygon = insetPolygon
    ? difference(featureCollection([combinedPolygon, insetPolygon]))
    : combinedPolygon;

  return {
    type: 'FeatureCollection',
    features: [ringPolygon],
  };
}
