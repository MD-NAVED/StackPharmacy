import React, { useId } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Reusable StackPharmacy Option D (Minimal Flat Card Stack + Medical Cross) brand mark.
 * Renders crisp resolution-independent SVG with unique mask IDs safe for multiple instances.
 *
 * @param {object} props
 * @param {number} [props.size=36]
 * @param {'light' | 'dark'} [props.variant='light'] Palette matched to surface luminance
 * @param {boolean} [props.shadow=true]
 * @param {object} [props.sx={}]
 */
export default function BrandMark({ size = 36, variant = 'light', shadow = true, sx = {} }) {
  const uid = useId().replace(/:/g, '');
  const backColor = variant === 'dark' ? '#117065' : '#053B36';
  const midColor = variant === 'dark' ? '#14B8A6' : '#0E8378';
  const frontColor = variant === 'dark' ? '#34D399' : '#0BB87A';
  const cutMidId = `sp-cut-mid-${uid}`;
  const cutBackId = `sp-cut-back-${uid}`;

  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      role="img"
      aria-label="StackPharmacy"
      sx={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        ...(shadow
          ? {
              filter:
                variant === 'dark'
                  ? 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.36))'
                  : 'drop-shadow(0 3px 8px rgba(5, 59, 54, 0.22))',
            }
          : {}),
        ...sx,
      }}
    >
      <defs>
        <mask id={cutMidId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="512" height="512" fill="#FFFFFF" />
          <rect
            x="246"
            y="114"
            width="186"
            height="308"
            rx="28"
            ry="28"
            fill="#000000"
            stroke="#000000"
            strokeWidth="18"
          />
        </mask>
        <mask id={cutBackId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="512" height="512" fill="#FFFFFF" />
          <g transform="rotate(-22 252 402)">
            <rect
              x="246"
              y="114"
              width="186"
              height="308"
              rx="28"
              ry="28"
              fill="#000000"
              stroke="#000000"
              strokeWidth="18"
            />
          </g>
          <rect
            x="246"
            y="114"
            width="186"
            height="308"
            rx="28"
            ry="28"
            fill="#000000"
            stroke="#000000"
            strokeWidth="18"
          />
        </mask>
      </defs>

      <g transform="translate(22 10)">
        <g mask={`url(#${cutBackId})`}>
          <g transform="rotate(-44 252 402)">
            <rect x="246" y="114" width="186" height="308" rx="28" ry="28" fill={backColor} />
          </g>
        </g>

        <g mask={`url(#${cutMidId})`}>
          <g transform="rotate(-22 252 402)">
            <rect x="246" y="114" width="186" height="308" rx="28" ry="28" fill={midColor} />
          </g>
        </g>

        <rect x="246" y="114" width="186" height="308" rx="28" ry="28" fill={frontColor} />
        <g fill="#FFFFFF">
          <rect x="287" y="251" width="104" height="34" rx="4" />
          <rect x="322" y="216" width="34" height="104" rx="4" />
        </g>
      </g>
    </Box>
  );
}

/**
 * Two-tone StackPharmacy wordmark synced cleanly with Option D icon palette:
 * Light background -> "Stack" (#053B36) + "Pharmacy" (#0E8378)
 * Dark background  -> "Stack" (#FFFFFF) + "Pharmacy" (#5EEAD4)
 */
export function BrandWordmark({ variant = 'light', typographyProps = {}, sx = {} }) {
  const stackColor = variant === 'dark' ? '#FFFFFF' : '#053B36';
  const pharmaColor = variant === 'dark' ? '#5EEAD4' : '#0E8378';
  return (
    <Typography
      {...typographyProps}
      sx={{ fontWeight: 800, display: 'inline-block', lineHeight: 1.15, ...sx }}
    >
      <Box component="span" sx={{ color: stackColor }}>Stack</Box>
      <Box component="span" sx={{ color: pharmaColor }}>Pharmacy</Box>
    </Typography>
  );
}
