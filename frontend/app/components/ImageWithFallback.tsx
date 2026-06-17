"use client";

import React, { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  className,
  style,
  width,
  height,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  const handleError = () => {
    if (!error) {
      setError(true);
      if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      }
    }
  };

  if (error && !fallbackSrc) {
    return (
      <div
        className={className}
        style={{
          ...style,
          width: width,
          height: height,
          background: "linear-gradient(135deg, #fde8d8 0%, #f5c4a0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "inherit",
        }}
      >
        <span style={{ fontSize: "2rem" }}>🐾</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      onError={handleError}
    />
  );
}
