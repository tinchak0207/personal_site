// 广告多尺寸投放：上游 API 仅支持以下 3 个尺寸，id 即透传给 API 的 size 参数。

export interface AdSizeOption {
  id: string;
  label: string;
  usage: string;
}

export const AD_SIZE_OPTIONS: AdSizeOption[] = [
  { id: "1024x1024", label: "1:1 方图", usage: "电商主图 / 朋友圈广告" },
  { id: "1536x1024", label: "3:2 横图", usage: "banner / 公众号头图" },
  { id: "1024x1536", label: "2:3 竖图", usage: "开屏海报 / 小红书封面" },
];

const DEFAULT_SIZE = "1024x1024";

export function normalizeSizeSelection(sizes: string[]): string[] {
  const selected = new Set(sizes);
  const result = AD_SIZE_OPTIONS.filter((option) => selected.has(option.id)).map(
    (option) => option.id
  );
  return result.length > 0 ? result : [DEFAULT_SIZE];
}

export function sizeForSlot(sizes: string[], slotIndex: number): string {
  if (sizes.length === 0) return DEFAULT_SIZE;
  return sizes[slotIndex % sizes.length];
}
