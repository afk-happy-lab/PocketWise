export const colors = {
  bg: '#070B14', bg2: '#0D1422', card: '#111B2C', elevated: '#162238',
  cyan: '#00E5FF', blue: '#1677FF', violet: '#7047FF',
  text: '#F3F7FF', muted: '#96A6C0', positive: '#00E6A0', negative: '#FF496C',
  border: '#24334B',
} as const;
export const gradient = [colors.cyan, colors.blue, colors.violet] as const;
export const radius = { sm: 10, md: 14, lg: 20 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const type = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.muted },
};
