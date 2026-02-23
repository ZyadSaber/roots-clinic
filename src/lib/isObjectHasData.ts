const isObjectHasData = (obj: unknown): obj is Record<string, unknown> => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    !Array.isArray(obj) &&
    Object.keys(obj).length > 0
  );
};

export default isObjectHasData;
