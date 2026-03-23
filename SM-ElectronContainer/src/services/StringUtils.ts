export function containsInsensitive(input: string, value: string): boolean {
  return input.toLowerCase().includes(value.toLowerCase());
}

export function findAndGetKeywords(input: string, keywords: string[]): string {
  const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');
  const match = input.match(pattern);
  return match ? match[0] : '';
}

export function toEnum<T>(value: string): T {
  return value as unknown as T;
}
