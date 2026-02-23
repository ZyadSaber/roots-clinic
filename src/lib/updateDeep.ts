const updateDeep = <T>(obj: T, path: string[], val: unknown): T => {
  const [head, ...tail] = path;

  if (!head) return obj;

  if (tail.length === 0) {
    if (Array.isArray(obj)) {
      const newArr = [...obj];
      newArr[Number(head)] = val;
      return newArr as unknown as T;
    }
    return {
      ...(obj as object),
      [head]: val,
    } as T;
  }

  const currentVal = (obj as Record<string, string>)?.[head];
  const updatedChild = updateDeep(currentVal ?? {}, tail, val);

  if (Array.isArray(obj)) {
    const newArr = [...obj];
    newArr[Number(head)] = updatedChild;
    return newArr as unknown as T;
  }

  return {
    ...(obj as object),
    [head]: updatedChild,
  } as T;
};

export default updateDeep;
