// Etiqueta IATA: exatamente 10 dígitos numéricos.
export const TAG_IATA_REGEX = /^\d{10}$/;

export function validarTagIata(valor: string | null | undefined): boolean {
  return typeof valor === 'string' && TAG_IATA_REGEX.test(valor.trim());
}

export function normalizarTagIata(valor: string): string {
  return valor.trim();
}

// Usado no TextInput manual: remove tudo que não é dígito e limita a 10.
export function somenteDigitosIata(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 10);
}

export function formatarTagIata(valor: string | null | undefined): string {
  const tag = (valor ?? '').trim();
  return tag.length === 10 ? `${tag.slice(0, 3)} ${tag.slice(3, 6)} ${tag.slice(6)}` : tag;
}
