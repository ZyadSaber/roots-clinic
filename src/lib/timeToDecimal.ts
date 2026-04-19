export function timeToDecimal(time: string): number {
  if (!time) return 8;
  const [rawTime, period] = time.split(" ");
  const [h, mString] = rawTime.split(":");
  let hNum = Number(h);
  const mNum = Number(mString);
  if (period === "PM" && hNum !== 12) hNum += 12;
  if (period === "AM" && hNum === 12) hNum = 0;
  return hNum + (mNum || 0) / 60;
}
