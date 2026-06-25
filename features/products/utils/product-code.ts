export function generateProductCode(prefix = "PRD") {
  const timestamp =
    Date.now();

  return `${prefix}-${timestamp}`;
}
