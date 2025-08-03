export const numberFormatter = (nonFormattedNumber: number) => {
  return Intl.NumberFormat("pt-BR", {
    style: "decimal",
    notation: "compact",
  }).format(nonFormattedNumber);
};
