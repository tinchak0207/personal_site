import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalBootProps {
  onComplete: () => void;
}

export const TerminalBoot: React.FC<TerminalBootProps> = ({ onComplete }) => {
  const [lines, setLines] = useState<{time: string, text: string, currentText: string}[]>([]);
  const [isDone, setIsDone] = useState(false);

  const BOOT_LOGS = [
    "在想了...",
    "要這樣做嗎？",
    "有些念頭...算了，先記下來。",
    "...",
    "打結了。",
    "刪掉。全部推倒。",
    "換深綠色吧。",
    "這個顏色對了。",
    "Let's go!"
  ];

  useEffect(() => {
    let currentLineIdx = 0;
    let currentCharIdx = 0;
    let isTyping = true;
    let typeInterval: NodeJS.Timeout;

    const startTyping = () => {
      if (currentLineIdx >= BOOT_LOGS.length) {
        setTimeout(() => {
          setIsDone(true);
          setTimeout(onComplete, 400); // reduced from 1200
        }, 500); // reduced from 1500
        return;
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const targetText = BOOT_LOGS[currentLineIdx];

      // Add empty line first
      setLines(prev => [...prev, { time: timeStr, text: targetText, currentText: "" }]);
      currentCharIdx = 0;
      isTyping = true;

        // Typewriter effect for current line
      typeInterval = setInterval(() => {
        if (currentCharIdx < targetText.length) {
          currentCharIdx++;
          setLines(prev => {
            const newLines = [...prev];
            if (newLines[currentLineIdx]) {
              newLines[currentLineIdx].currentText = targetText.slice(0, currentCharIdx);
            }
            return newLines;
          });
        } else {
          // Finished typing current line
          clearInterval(typeInterval);
          isTyping = false;
          currentLineIdx++;
          
          // Wait a bit before starting next line (shorter wait)
          setTimeout(startTyping, 400);
        }
      }, 40); // Slightly faster typing speed
    };

    startTyping();

    return () => {
      if (typeInterval) clearInterval(typeInterval);
    };
  }, []);

  // Function to determine if we should switch to green
  // The switch happens when we reach line index 6 ("換深綠色吧。") 
  // AND the current text includes the character "綠" (which means "深綠" has just been typed)
  // OR we are past line 6.
  const shouldBeGreen = (lines: typeof lines) => {
    if (lines.length > 7) return true; // Past the line
    if (lines.length === 7) {
      // The line is "換深綠色吧。" (index 6 in 0-based array, but lines.length is 7)
      const currentText = lines[6].currentText;
      return currentText.includes('綠');
    }
    return false;
  };

  const isGreen = shouldBeGreen(lines);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.5, 
            filter: "brightness(2) blur(10px)",
          }}
          transition={{ 
            duration: 0.4, // Fast snap
            ease: "easeIn" 
          }}
          className={`fixed inset-0 z-40 flex flex-col p-12 sm:p-24 font-pixel text-lg sm:text-xl tracking-wide ${
            isGreen ? "bg-[#030a07] text-[#8FBC8F]" : "bg-[#fffaf0] text-[#FF8C00]"
          }`}
        >
          <div className="flex-1 flex flex-col justify-center">
            {lines.map((line, i) => (
              <motion.div
                key={`${i}-${line.text}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 flex font-pixel"
              >
                <span className="opacity-40 mr-6">[{line.time}]</span>
                <span>
                  {line.currentText}
                  {/* Blinking cursor only on the active typing line */}
                  {i === lines.length - 1 && (
                    <motion.span 
                      animate={{ opacity: [1, 0] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className={`w-2.5 h-5 inline-block ml-1 align-middle ${
                        isGreen ? "bg-[#8FBC8F]" : "bg-[#FF8C00]"
                      }`}
                    />
                  )}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="text-center opacity-10 text-xs tracking-[0.5em] mt-auto">
            NEURAL HANDSHAKE IN PROGRESS
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};