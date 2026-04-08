import { useWindowDimensions } from 'react-native'

export function useLayout() {
  const { width, height } = useWindowDimensions()
  const isTablet = width >= 768
  const isLandscape = width > height
  const columns = isTablet ? (isLandscape ? 3 : 2) : 1

  return {
    width,
    height,
    isTablet,
    isLandscape,
    columns,
    // Responsive spacing
    contentPadding: isTablet ? 40 : 24,
    cardMaxWidth: isTablet ? 800 : undefined,
    // Photo grid columns
    photoColumns: isTablet ? (isLandscape ? 5 : 4) : 3,
    // Font scale
    fontScale: isTablet ? 1.15 : 1,
    // Stats row
    statsColumns: isTablet ? 4 : 3,
  }
}
