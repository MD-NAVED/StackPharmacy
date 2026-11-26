import React from 'react';
import { Box } from '@mui/material';

/**
 * Reusable StackPharmacy Concept 3 (3D Glass Shield) app icon / brand mark.
 */
export default function BrandMark({ size = 36, radius = '22%', shadow = true, sx = {} }) {
  return (
    <Box
      component="img"
      src="/icon-192.png"
      alt="StackPharmacy"
      sx={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
        ...(shadow ? { boxShadow: '0 2px 8px rgba(0, 56, 46, 0.22)' } : {}),
        ...sx,
      }}
    />
  );
}
