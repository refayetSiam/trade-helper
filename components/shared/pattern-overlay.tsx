'use client';

import React from 'react';
import { PatternOverlay } from '@/lib/services/pattern-detection';

interface PatternOverlayComponentProps {
  overlays: PatternOverlay[];
  width: number;
  height: number;
  xScale: (value: any) => number;
  yScale: (value: any) => number;
  onPatternClick?: (overlay: PatternOverlay) => void;
}

const PatternOverlayComponent: React.FC<PatternOverlayComponentProps> = ({
  overlays,
  width,
  height,
  xScale,
  yScale,
  onPatternClick,
}) => {
  // Track label positions to avoid overlaps
  const labelPositions: { x: number; y: number; width: number; height: number }[] = [];

  const findNonOverlappingPosition = (
    baseX: number,
    baseY: number,
    labelWidth: number = 100,
    labelHeight: number = 20
  ) => {
    let x = baseX;
    let y = baseY;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const overlapping = labelPositions.some(
        pos =>
          x < pos.x + pos.width &&
          x + labelWidth > pos.x &&
          y < pos.y + pos.height &&
          y + labelHeight > pos.y
      );

      if (!overlapping) {
        labelPositions.push({ x, y, width: labelWidth, height: labelHeight });
        return { x, y };
      }

      // Try different positions
      if (attempts % 2 === 0) {
        y += labelHeight + 5; // Move down
      } else {
        x += labelWidth / 2; // Move right
        y = baseY; // Reset Y
      }
      attempts++;
    }

    // If all attempts fail, use base position
    labelPositions.push({ x: baseX, y: baseY, width: labelWidth, height: labelHeight });
    return { x: baseX, y: baseY };
  };

  const renderOverlay = (overlay: PatternOverlay, index: number) => {
    const handleClick = () => {
      if (onPatternClick) {
        onPatternClick(overlay);
      }
    };

    // Validate overlay values to prevent NaN
    if (
      overlay.startX == null ||
      overlay.startY == null ||
      isNaN(overlay.startX) ||
      isNaN(overlay.startY)
    ) {
      return null;
    }

    switch (overlay.type) {
      case 'box':
        const x1 = xScale(overlay.startX);
        const y1 = yScale(overlay.startY);
        const x2 = xScale(overlay.endX || overlay.startX);
        const y2 = yScale(overlay.endY || overlay.startY);

        // Additional validation after scaling
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
          return null;
        }

        return (
          <g key={index}>
            <rect
              x={Math.min(x1, x2) - 5}
              y={Math.min(y1, y2) - 5}
              width={Math.abs(x2 - x1) + 10}
              height={Math.abs(y2 - y1) + 10}
              fill="none"
              stroke={overlay.color}
              strokeWidth={overlay.strokeWidth}
              strokeDasharray="5,5"
              opacity={0.8}
              className="cursor-pointer hover:opacity-100"
              onClick={handleClick}
            />
            {overlay.label &&
              (() => {
                const labelPos = findNonOverlappingPosition(
                  Math.min(x1, x2),
                  Math.min(y1, y2) - 8,
                  overlay.label.length * 7, // Approximate width
                  16 // Approximate height
                );
                return (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={overlay.color}
                    fontSize="11"
                    fontWeight="600"
                    className="pointer-events-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {overlay.label}
                  </text>
                );
              })()}
          </g>
        );

      case 'line':
        const lineX1 = xScale(overlay.startX);
        const lineY1 = yScale(overlay.startY);
        const lineX2 = xScale(overlay.endX || overlay.startX);
        const lineY2 = yScale(overlay.endY || overlay.startY);

        // Validate line coordinates
        if (isNaN(lineX1) || isNaN(lineY1) || isNaN(lineX2) || isNaN(lineY2)) {
          return null;
        }

        // Enhanced line styling based on pattern type
        const isTargetStop = overlay.patternType === 'target' || overlay.patternType === 'stop';
        const dashArray = isTargetStop
          ? '5,3'
          : overlay.patternType === 'support' || overlay.patternType === 'resistance'
            ? '8,4'
            : 'none';

        return (
          <g key={index}>
            {/* Main line */}
            <line
              x1={lineX1}
              y1={lineY1}
              x2={lineX2}
              y2={lineY2}
              stroke={overlay.color}
              strokeWidth={overlay.strokeWidth}
              strokeDasharray={dashArray}
              opacity={0.8}
              className="cursor-pointer hover:opacity-100"
              onClick={handleClick}
            />

            {/* Pattern code badge at the start of the line */}
            {overlay.code && (
              <g>
                <rect
                  x={lineX1 - 15}
                  y={lineY1 - 8}
                  width={30}
                  height={16}
                  fill={overlay.color}
                  rx={3}
                  opacity={0.9}
                  className="cursor-pointer hover:opacity-100"
                  onClick={handleClick}
                />
                <text
                  x={lineX1}
                  y={lineY1 + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {overlay.code}
                </text>
              </g>
            )}

            {/* Label at the end of the line */}
            {overlay.label &&
              (() => {
                const labelPos = findNonOverlappingPosition(
                  lineX2 + 8,
                  lineY2 - 2,
                  overlay.label.length * 5,
                  12
                );
                return (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={overlay.color}
                    fontSize="9"
                    fontWeight="500"
                    className="pointer-events-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {overlay.label}
                  </text>
                );
              })()}
          </g>
        );

      case 'icon':
        const iconX = xScale(overlay.startX);
        const iconY = yScale(overlay.startY);

        // Validate icon coordinates
        if (isNaN(iconX) || isNaN(iconY)) {
          return null;
        }

        // Enhanced styling based on pattern type and confidence
        const isHighConfidence = overlay.confidence === 'high';
        const radius = isHighConfidence ? 12 : 10;
        const strokeWidth = isHighConfidence ? 2 : 1;

        return (
          <g key={index}>
            {/* Outer ring for high confidence patterns */}
            {isHighConfidence && (
              <circle
                cx={iconX}
                cy={iconY}
                r={radius + 2}
                fill="none"
                stroke={overlay.color}
                strokeWidth={1}
                opacity={0.6}
                className="cursor-pointer hover:opacity-100"
                onClick={handleClick}
              />
            )}

            {/* Main pattern circle */}
            <circle
              cx={iconX}
              cy={iconY}
              r={radius}
              fill={overlay.color}
              opacity={0.9}
              stroke="white"
              strokeWidth={strokeWidth}
              className="cursor-pointer hover:opacity-100 drop-shadow-lg"
              onClick={handleClick}
            />

            {/* Pattern code text */}
            <text
              x={iconX}
              y={iconY + 4}
              textAnchor="middle"
              fill="white"
              fontSize={overlay.code && overlay.code.length > 2 ? '8' : '10'}
              fontWeight="bold"
              className="pointer-events-none"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              {overlay.code || overlay.icon || '!'}
            </text>

            {/* Confidence indicator */}
            {isHighConfidence && (
              <text
                x={iconX + radius + 4}
                y={iconY - radius}
                fill={overlay.color}
                fontSize="8"
                fontWeight="600"
                className="pointer-events-none"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                ★
              </text>
            )}

            {/* Label with improved positioning */}
            {overlay.label &&
              (() => {
                const labelPos = findNonOverlappingPosition(
                  iconX + radius + 6,
                  iconY + 4,
                  overlay.label.length * 5.5,
                  12
                );
                return (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={overlay.color}
                    fontSize="9"
                    fontWeight="500"
                    className="pointer-events-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {overlay.label}
                  </text>
                );
              })()}
          </g>
        );

      case 'arrow':
        const arrowX = xScale(overlay.startX);
        const arrowY = yScale(overlay.startY);
        const arrowEndX = xScale(overlay.endX || overlay.startX);
        const arrowEndY = yScale(overlay.endY || overlay.startY);

        // Validate arrow coordinates
        if (isNaN(arrowX) || isNaN(arrowY) || isNaN(arrowEndX) || isNaN(arrowEndY)) {
          return null;
        }

        // Calculate arrow direction
        const angle = Math.atan2(arrowEndY - arrowY, arrowEndX - arrowX);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;

        return (
          <g key={index}>
            <line
              x1={arrowX}
              y1={arrowY}
              x2={arrowEndX}
              y2={arrowEndY}
              stroke={overlay.color}
              strokeWidth={overlay.strokeWidth}
              opacity={0.9}
              className="cursor-pointer hover:opacity-100"
              onClick={handleClick}
            />
            {/* Arrow head */}
            <polygon
              points={`${arrowEndX},${arrowEndY} ${arrowEndX - arrowLength * Math.cos(angle - arrowAngle)},${arrowEndY - arrowLength * Math.sin(angle - arrowAngle)} ${arrowEndX - arrowLength * Math.cos(angle + arrowAngle)},${arrowEndY - arrowLength * Math.sin(angle + arrowAngle)}`}
              fill={overlay.color}
              opacity={0.9}
              className="cursor-pointer hover:opacity-100"
              onClick={handleClick}
            />
            {overlay.label &&
              (() => {
                const labelPos = findNonOverlappingPosition(
                  (arrowX + arrowEndX) / 2,
                  (arrowY + arrowEndY) / 2 - 8,
                  overlay.label.length * 6,
                  14
                );
                return (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    fill={overlay.color}
                    fontSize="10"
                    fontWeight="500"
                    className="pointer-events-none"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {overlay.label}
                  </text>
                );
              })()}
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {overlays.map((overlay, index) => renderOverlay(overlay, index))}
    </svg>
  );
};

export default PatternOverlayComponent;
