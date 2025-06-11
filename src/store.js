import { buffer, difference, featureCollection, union } from '@turf/turf';

export const createStore = ({ map }) => {
  const eventTarget = new EventTarget();
  let _landId;
  let _highlightedLandId;
  const state = Object.defineProperties(
    {},
    {
      selectedLand: {
        get() {
          return {
            id: _landId ?? undefined,
            ringGeoJSON: getRingGeoJSON({ landId: _landId, map }),
          };
        },
        enumerable: true,
      },

      highlightedLand: {
        get() {
          return {
            landId: _highlightedLandId ?? undefined,
          };
        },
      },
    },
  );

  // todo hide eventTargetInterface
  return Object.assign(eventTarget, {
    selectLand({ landId }) {
      _landId = landId;
      eventTarget.dispatchEvent(
        new CustomEvent('landSelected', {
          detail: {
            landId,
          },
        }),
      );
    },
    highlightLand({ landId: newLandId }) {
      const oldLandId = _highlightedLandId;
      _highlightedLandId = newLandId;
      eventTarget.dispatchEvent(
        new CustomEvent('landHighlighted', {
          detail: {
            newLandId,
            oldLandId,
          },
        }),
      );
    },
    getState() {
      return {
        ...state,
      };
    },
  });
};

function getRingGeoJSON({ landId, map }) {
  if (!landId) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const features = map.querySourceFeatures('cadastre', {
    filter: ['==', ['get', 'id'], landId],
  });
  const combinedPolygon =
    features.length >= 2 ? union(featureCollection(features)) : features.at(0);

  const insetPolygon = buffer(combinedPolygon, -4, {
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
