import { HistoryClient } from "@/components/HistoryClient";

export const metadata = {
  title: "生成歷史 · Image Studio",
  description: "查看你的所有生成記錄與消耗明細。",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
