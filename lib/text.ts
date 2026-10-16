/** "1 defect", "3 defects", "1 person", "2 people". */
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
