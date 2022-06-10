export function toArray(data: number | number[]): number[]{
    if (Array.isArray(data)) return data;
    else return [data];
}