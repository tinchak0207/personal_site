export type ProviderKey = "image_tinchak";
export type ModelMode = "fast" | "quality";

export const PROVIDERS = {
  image_tinchak: {
    displayName: "圖像引擎",
    iconPath: "/provider-icons/openai.svg",
    color: "from-slate-200 to-white",
    models: ["gpt-image-2", "gpt-image-1"],
  },
} satisfies Record<
  ProviderKey,
  {
    displayName: string;
    iconPath: string;
    color: string;
    models: string[];
  }
>;

export const MODEL_CONFIGS: Record<ModelMode, Record<ProviderKey, string>> = {
  fast: {
    image_tinchak: "gpt-image-2",
  },
  quality: {
    image_tinchak: "gpt-image-2",
  },
};

export const PROVIDER_ORDER: ProviderKey[] = ["image_tinchak"];

export const initializeProviderRecord = <T>(defaultValue?: T) =>
  Object.fromEntries(PROVIDER_ORDER.map((key) => [key, defaultValue])) as Record<
    ProviderKey,
    T
  >;
