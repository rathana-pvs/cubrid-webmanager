/**
 * Omits the 'password' property from a single object.
 *
 * @param param - The object from which to omit the password.
 * @returns A new object without the 'password' property.
 * @category Utilities
 * @since 1.0.0
 */
export function omitPassword<T extends { password: any }>(param: T) {
  const { password, ...rv } = param;
  return rv;
}

/**
 * Omits the 'password' property from each object in an array.
 *
 * @param param - The array of objects from which to omit passwords.
 * @returns A new array with objects that do not have the 'password' property.
 * @category Utilities
 * @since 1.0.0
 */
export function omitPasswordArray<T extends { password: any }>(param: T[]): Omit<T, 'password'>[] {
  return param.map(({ password: _password, ...rv }) => rv);
}

/**
 * Omits the 'password' property from each value in a HashMap.
 *
 * @param hashMap - The HashMap from which to omit passwords.
 * @returns A new HashMap with values that do not have the 'password' property.
 * @category Utilities
 * @since 1.0.0
 */
export function omitPasswordHashMap<T extends { password: any }>(
  hashMap: Record<string, T>
): Record<string, Omit<T, 'password'>> {
  const result: Record<string, Omit<T, 'password'>> = {};

  for (const [key, value] of Object.entries(hashMap)) {
    const { password, ...rv } = value;
    result[key] = rv;
  }

  return result;
}

/**
 * Omits specified keys from each value in a generic HashMap.
 *
 * @param hashMap - The HashMap from which to omit keys.
 * @param keys - An array of keys to omit.
 * @returns A new HashMap with values that do not have the specified keys.
 * @category Utilities
 * @since 1.0.0
 */
export function omitHashMap<T, K extends keyof T>(
  hashMap: Record<string, T>,
  keys: K[]
): Record<string, Omit<T, K>> {
  const result: Record<string, Omit<T, K>> = {};

  for (const [key, value] of Object.entries(hashMap)) {
    const omittedValue = { ...value };
    keys.forEach((keyToOmit) => delete omittedValue[keyToOmit]);
    result[key] = omittedValue as Omit<T, K>;
  }

  return result;
}
