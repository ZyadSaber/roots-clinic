const currencyFormat = (amount: number, currency: string) => (
    new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) +
    " " + currency
);

export default currencyFormat