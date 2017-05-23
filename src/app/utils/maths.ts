export function round(n: number, decimalPlace: number): number {
    const x = 10 ** decimalPlace;
    return Math.round(n * x) / x;
}
