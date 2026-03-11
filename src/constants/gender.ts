export const getGenderList = (t: (key: string) => string, extra?: boolean) => {
  return [
    ...(extra ? [{ key: "all", label: t("genders.all") }] : []),
    { key: "male", label: t("genders.male") },
    { key: "female", label: t("genders.female") },
  ];
};
