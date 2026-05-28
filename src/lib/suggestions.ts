export interface Suggestion {
  text: string;
  prompt: string;
}

const basePrompts: Suggestion[] = [
  {
    text: "香水海灘廣告",
    prompt:
      "幫我把這瓶香水放在落日的海灘上，要有高級網美風的環境光，像精品品牌廣告。",
  },
  {
    text: "咖啡店新品海報",
    prompt:
      "幫我做一張咖啡店新品海報，木質桌面、早晨陽光、奶油色調，整體乾淨又有質感。",
  },
  {
    text: "飾品商品照",
    prompt:
      "把這款耳環做成像棚拍商品圖，背景乾淨，金屬反光細緻，整體要有高級感。",
  },
  {
    text: "甜點社群圖",
    prompt:
      "做一張適合發社群的甜點照片，草莓蛋糕放在窗邊桌上，光線柔和，看起來很想讓人立刻下單。",
  },
  {
    text: "小店促銷素材",
    prompt:
      "幫我做一張小店限時優惠宣傳圖，畫面簡潔、好讀，像品牌在做活動視覺。",
  },
];

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function getRandomSuggestions(count: number = 5): Suggestion[] {
  return shuffle(basePrompts).slice(0, count);
}
