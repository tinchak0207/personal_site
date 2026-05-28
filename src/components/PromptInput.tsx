import { useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getRandomSuggestions, Suggestion } from "@/lib/suggestions";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  suggestions: Suggestion[];
}

export function PromptInput({
  suggestions: initialSuggestions,
  isLoading,
  onSubmit,
}: PromptInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] =
    useState<Suggestion[]>(initialSuggestions);

  const updateSuggestions = () => {
    setSuggestions(getRandomSuggestions());
  };

  const handleSuggestionSelect = (prompt: string) => {
    setInput(prompt);
    onSubmit(prompt);
  };

  const handleSubmit = () => {
    if (!isLoading && input.trim()) {
      onSubmit(input);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(input);
      }
    }
  };

  return (
    <section className="paper-card liquid-stage relative overflow-hidden rounded-[2.4rem] p-5 sm:p-6 lg:p-7">
      <div className="relative space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#7b8694]">
              需求
            </p>
            <p className="mt-2 text-sm leading-7 text-[#6e7886]">
              直接描述你要的畫面。
            </p>
          </div>

          <p className="text-sm leading-7 text-[#6e7886]">
            Enter 送出，Shift + Enter 換行
          </p>
        </div>

        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="試試輸入：幫我把這瓶香水放在落日的海灘上，要有高級網美風的環境光"
          rows={5}
          className="min-h-[220px] rounded-[2rem] px-5 py-5 text-[15px] leading-8"
        />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-[#7b8694]">
              <button
                type="button"
                onClick={updateSuggestions}
                className="paper-float flex h-10 w-10 items-center justify-center rounded-full text-[#6e7886] transition-transform duration-200 hover:-translate-y-[1px]"
                aria-label="更新範例"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              範例
            </div>

            <div className="flex flex-wrap gap-2.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.text}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion.prompt)}
                  className={cn(
                    "paper-float group rounded-full px-4 py-2.5 text-left text-sm text-[#6f7987] transition-all duration-200 hover:-translate-y-[1px] hover:text-foreground",
                  )}
                >
                  <span className="font-medium text-foreground/86">
                    {suggestion.text}
                  </span>
                  <span className="ml-2 text-[#8b94a0] transition-colors duration-200 group-hover:text-foreground/70">
                    {String.fromCharCode(8599)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="inline-flex min-w-[186px] items-center justify-center gap-3 rounded-full bg-[#2d3142] px-5 py-3.5 text-sm font-medium text-white shadow-[0_18px_36px_rgba(45,49,66,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#272b39] disabled:cursor-not-allowed disabled:bg-[#bcc2ca] disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4 text-white" />
                正在做圖
              </>
            ) : (
              <>
                開始做圖
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
