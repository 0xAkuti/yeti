'use client';

interface TokenIconProps {
  src: string;
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenIcon({ src, symbol, size = 32, className = '' }: TokenIconProps) {
  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
}