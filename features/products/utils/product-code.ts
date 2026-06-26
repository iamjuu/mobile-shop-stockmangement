export function generateProductCode(prefix = "PRD") {
  const timestamp =
    Date.now();
  const random =
    Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
}
