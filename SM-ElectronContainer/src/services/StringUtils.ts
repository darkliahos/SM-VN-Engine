export function containsInsensitive(input: string, value: string): boolean {
  return input.toLowerCase().includes(value.toLowerCase());
}
