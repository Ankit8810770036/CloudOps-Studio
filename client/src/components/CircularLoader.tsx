import React from 'react';

interface CircularLoaderProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CircularLoader: React.FC<CircularLoaderProps> = ({
  size = 18,
  strokeWidth = 2.75,
  color = 'currentColor',
  trackColor = 'rgba(255, 255, 255, 0.18)',
  className = '',
  style = {}
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`circular-spinner ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
      role="status"
      aria-label="Processing"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.65}
        className="circular-spinner-path"
      />
    </svg>
  );
};
