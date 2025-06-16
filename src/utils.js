export const encodeState = ({ state, origin = window.location }) => {
  const currentUrl = new URL(origin);
  const { center, zoom } = state.map;
  const { id: landId } = state.selectedLand;
  const { lng, lat } = center;
  const searchParams = new URLSearchParams(
    pickBy(
      {
        landId,
        lng,
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
        searchParams.get('lng') ?? 5.6770271,
        searchParams.get('lat') ?? 43.52602,
      ],
      zoom: searchParams.get('zoom') ?? 17,
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
