import { ImagePlayground } from "@/components/ImagePlayground";
import { getAllSuggestions } from "@/lib/suggestions";

export default function Page() {
  return <ImagePlayground suggestions={getAllSuggestions()} />;
}
