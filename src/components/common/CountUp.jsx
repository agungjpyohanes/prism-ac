import React, { useState, useEffect } from 'react';

export default function CountUp({ target = 0, isPct = false, duration = 800 }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start = null;
    const end = parseFloat(target) || 0;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(end * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  if (isPct) {
    return <span>{val.toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%</span>;
  }
  return <span>{Math.round(val).toLocaleString('id-ID')}</span>;
}