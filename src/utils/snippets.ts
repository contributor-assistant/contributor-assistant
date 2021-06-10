export function spliceArray<T>(
  array: T[],
  predicate: (element: T) => boolean,
) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      array.splice(i, 1);
      i--;
    }
  }
}
