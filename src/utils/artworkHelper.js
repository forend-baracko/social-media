export const getArtworkSource = (artwork) => {
  if (typeof artwork === 'string') {
    return { uri: artwork };
  }

  if (typeof artwork === 'number' || (artwork && typeof artwork === 'object')) {
    return artwork;
  }

  return null;
};
