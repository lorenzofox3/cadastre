export const encodeState = ({ state, origin = window.location }) => {
  const currentUrl = new URL(origin);
  const { center, zoom } = state.map;
  const {
    selectedLand: { id: landId },
  } = state.land;
  const [lgn, lat] = center;
  const searchParams = new URLSearchParams(
    pickBy(
      {
        landId,
        lgn,
        lat,
        zoom,
      },
      ([, value]) => Boolean(value),
    ),
  );

  currentUrl.search = searchParams.toString();

  return currentUrl;
};

export const decodeState = ({ url }) => {
  const searchParams = new URL(url).searchParams;
  return {
    map: {
      center: [
        searchParams.get('lgn') ?? 5.6770271,
        searchParams.get('lat') ?? 5.6770271,
      ],
      zoom: searchParams.get('zoom') ?? 18,
    },
    selectedLand: {
      id: searchParams.get('landId') ?? undefined,
      features: [],
    },
    highlightedLand: {
      id: undefined,
    },
  };
};

export const pickBy = (object, predicate) => {
  return Object.fromEntries(Object.entries(object).filter(predicate));
};
