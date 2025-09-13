import { Colors } from './colors';
import { Typography } from './typography';
import { Spacing, Layout } from './spacing';

export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  layout: Layout,
};

export { Colors, Typography, Spacing, Layout };
export type Theme = typeof theme;
