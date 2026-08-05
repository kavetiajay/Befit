import React, { useEffect, useState } from "react";

export const AnimatedNumber = ({ value }) => {
  const [displayVal, setDisplayVal] = useState("0");

  useEffect(() => {
    const str = String(value);
    // Find decimal or integer values
    const numMatch = str.match(/[\d.]+/);
    if (!numMatch) {
      setDisplayVal(str);
      return;
    }

    const numStr = numMatch[0];
    const target = parseFloat(numStr);
    const prefix = str.substring(0, numMatch.index);
    const suffix = str.substring(numMatch.index + numStr.length);

    let start = 0;
    const duration = 1200; // 1.2s count up transition
    const startTime = performance.now();

    const updateNumber = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + ease * (target - start);
      
      // Format to matching decimal points if target has decimals
      const formatted = numStr.includes(".")
        ? current.toFixed(numStr.split(".")[1].length)
        : Math.floor(current).toString();

      setDisplayVal(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        setDisplayVal(str);
      }
    };

    requestAnimationFrame(updateNumber);
  }, [value]);

  return <>{displayVal}</>;
};
