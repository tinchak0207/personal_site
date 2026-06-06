import { HistoryClient } from "@/components/HistoryClient";

export const metadata = {
  title: "生成历史 · Image Studio",
  description: "查看你的所有生成记录和消耗明细。",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
