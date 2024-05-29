export function changeKey(obj, oldKey, newKey) {
  if (oldKey !== newKey && obj.hasOwnProperty(oldKey)) {
    obj[newKey] = obj[oldKey]; // Copy the value to the new key
    delete obj[oldKey]; // Delete the old key
  }
  return obj;
}
