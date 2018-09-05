const isEmpty = outer => Object.values(outer).every(inner => Object.keys(inner).length === 0);

export default isEmpty;
