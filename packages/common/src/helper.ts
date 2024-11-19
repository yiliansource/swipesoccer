export function range(startOrLength: number, end?: number): number[] {
    return end ? [...Array(end - startOrLength).keys()] : [...Array(startOrLength).keys()];
}
