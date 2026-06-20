import type { StylePreset } from "@/lib/prompt-enhancer";

export interface ShowcaseCase {
  id: string;
  title: string;
  category: string;
  style: StylePreset;
  prompt: string;
  resultNote: string;
  gradient: string;
  image?: string;
}

export const SHOWCASE_CASES: ShowcaseCase[] = [
  {
    id: "global-skincare-branding",
    title: "全球同步：护肤品趋势大片",
    category: "品牌营销",
    style: "product",
    prompt: "参考 2026 年夏季 Instagram 上最流行的极简主义护肤品拍摄风格，为这款精华液生成一张广告图。要有流动的液体质感、柔和的自然光，以及符合当下潮流的莫兰迪配色。",
    resultNote: "联网检索当前视觉趋势，确保你的设计永远走在流行最前沿，告别‘AI味’的过时审美。",
    gradient: "from-[#F5F5F5] via-[#E0E0E0] to-[#CFD8DC]",
    image: "/showcase/showcase1.webp",
  },
  {
    id: "readable-craft-beer-label",
    title: "告别乱码：精酿啤酒包装",
    category: "包装设计",
    style: "product",
    prompt: "一瓶放在潮湿木质吧台上的精酿啤酒，标签上清晰显示：‘Midnight Forest’，下方小字标注‘IPA - 6.5% ALC’。要有冰镇的冷凝水珠和电影感的侧光。",
    resultNote: "GPT-Image-2 的文字渲染不再是摆设。从品牌名到成分表，所见即所得，直接出样机稿。",
    gradient: "from-[#1B1B1B] via-[#3A3A3A] to-[#2E7D32]",
    image: "/showcase/showcase2.webp",
  },
  {
    id: "tech-event-poster-dual-lang",
    title: "中英双语：科技峰会海报",
    category: "活动视觉",
    style: "poster",
    prompt: "2026 科技创新峰会海报。背景是半透明的量子计算网格，中央文字：‘The Future is Now / 未来已来’。字体要求现代感、高对比度，有足够的留白区域。",
    resultNote: "完美处理中英双语排版。无需二改，直接生成具备专业排版水平的活动主视觉。",
    gradient: "from-[#000428] via-[#004e92] to-[#00d2ff]",
    image: "/showcase/showcase3.webp",
  },
  {
    id: "cinematic-steampunk-train",
    title: "物理级透视：蒸汽朋克车站",
    category: "概念设计",
    style: "poster",
    prompt: "一个巨大的维多利亚风格火车站，一辆蒸汽火车正破雾驶来。复杂的钢结构穹顶透视要完全准确，阳光透过彩色玻璃窗斜射下来，形成清晰的丁达尔光瀑，地面的积水倒影出火车头的金属细节。",
    resultNote: "打破复杂场景‘透视必崩’的魔咒。无论是宏大建筑结构还是多光源重叠，系统都能严谨构筑物理级空间。",
    gradient: "from-[#1a1c23] via-[#8B7355] to-[#EEDC82]",
    image: "/showcase/showcase4.webp",
  },
  {
    id: "interior-trend-lookup",
    title: "实时样板间：极简家居设计",
    category: "室内设计",
    style: "product",
    prompt: "根据 2026 年米兰家具展最新的‘静谧主义’（Quiet Luxury）室内设计趋势，生成一个光影斑驳的客厅。要有侘寂风的纹理质感，家具比例要严格符合人体工学。",
    resultNote: "不止是画图，更是你的专业设计顾问。实时参考全球顶级展会风格，秒出效果图。",
    gradient: "from-[#EADEDB] via-[#BC948B] to-[#8E5E53]",
    image: "/showcase/showcase5.webp",
  },
  {
    id: "streetwear-drop-teaser",
    title: "新品预热：潮牌 Ins 滤镜",
    category: "社媒运营",
    style: "street",
    prompt: "模拟徕卡 M11 的直出色彩，拍摄一张街头卫衣特写。要有浓郁的胶片颗粒感，模特在过马路时的动态模糊，背景是东京涩谷的雨夜霓虹。",
    resultNote: "欺骗感官的直出质感。模糊了 AI 生成与胶片实拍的界限，极适合社媒高频率的新品预热。",
    gradient: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
    image: "/showcase/showcase6.webp",
  },
];
