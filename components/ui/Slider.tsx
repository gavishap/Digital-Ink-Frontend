'use client';

import React from 'react';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showEmojis?: boolean;
}

const emojiScale = ['😊', '🙂', '😐', '😕', '😟', '😦', '😧', '😨', '😰', '😱', '💀'];

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  showEmojis = true,
}: SliderProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        {showEmojis && (
          <div className="text-2xl flex-shrink-0">
            {value <= max ? emojiScale[Math.min(value, emojiScale.length - 1)] : emojiScale[emojiScale.length - 1]}
          </div>
        )}
        <div className="flex-1">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{min}</span>
            <span className="font-semibold text-base text-gray-900">Current: {value}</span>
            <span>{max}</span>
          </div>
        </div>
        {showEmojis && (
          <div className="text-2xl flex-shrink-0">
            {emojiScale[emojiScale.length - 1]}
          </div>
        )}
      </div>
    </div>
  );
}



