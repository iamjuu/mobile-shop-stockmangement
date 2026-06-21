export function generateProductCode() {
  const timestamp =
    Date.now();

  return `PRD-${timestamp}`;
}