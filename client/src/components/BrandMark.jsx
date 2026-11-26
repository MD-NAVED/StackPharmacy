import React from 'react';
import { Box } from '@mui/material';

/**
 * Reusable StackPharmacy Concept 3 (transparent 3D Glass Shield) brand mark.
 */
export default function BrandMark({ size = 36, shadow = true, sx = {} }) {
  return (
    <Box
      component="img"
      src="/logo-mark.png"
      alt="StackPharmacy"
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        ...(shadow ? { filter: 'drop-shadow(0 3px 8px rgba(0, 56, 46, 0.24))' } : {}),
        ...sx,
      }}
    />
  );
}
