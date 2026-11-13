/**
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu, đ/Đ -> d, viết thường) để hỗ trợ tìm kiếm có dấu và không dấu.
 */
export function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Ước tính kích thước UTF-8 (byte) của đối tượng JSON trước khi ghi vào Firestore (giới hạn 1 MB/tài liệu).
 */
export function estimateJsonByteSize(obj: unknown): number {
  try {
    const json = JSON.stringify(obj);
    return new Blob([json]).size;
  } catch {
    return 0;
  }
}
