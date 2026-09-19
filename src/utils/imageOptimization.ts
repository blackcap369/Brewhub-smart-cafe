/**
 * Image optimization utilities for BrewHub
 */

/**
 * Generate responsive image srcSet for different screen sizes
 */
export function generateSrcSet(baseUrl: string, sizes: number[] = [320, 640, 960, 1280, 1920]): string {
  return sizes.map(size => `${baseUrl}?w=${size}&q=80&format=webp ${size}w`).join(', ');
}

/**
 * Generate optimized image URL with WebP format and compression
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If it's already a Supabase storage URL, add transformation params
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('format', format);
    return `${url}?${params.toString()}`;
  }
  
  // For other URLs, return as-is (could be extended with CDN transformations)
  return url;
}

/**
 * Generate thumbnail URL for menu items
 */
export function getThumbnailUrl(url: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const sizes = {
    sm: { width: 100, height: 100 },
    md: { width: 300, height: 300 },
    lg: { width: 600, height: 600 },
  };
  
  return getOptimizedImageUrl(url, {
    ...sizes[size],
    quality: 75,
    format: 'webp',
  });
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiH/5GQAAABh0RVhUQ29tbWVudABDcmVhdGVkIHdpdGh GIMPWjQEEAAAASUVORK5CYII=';
  });
}

/**
 * Blur-up placeholder technique
 * Returns a tiny base64 encoded blurred version of the image
 */
export function getBlurPlaceholder(width: number = 20, height: number = 20): string {
  // This is a generic blur placeholder - in production, you'd generate this from the actual image
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/EAH/2Q==';
}

/**
 * Lazy load image with Intersection Observer
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
): () => void {
  const { rootMargin = '200px', threshold = 0.01 } = options;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    },
    { rootMargin, threshold }
  );
  
  observer.observe(imgElement);
  
  // Return cleanup function
  return () => observer.disconnect();
}

/**
 * Preload critical images
 */
export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Generate image dimensions for responsive layout
 */
export function getImageDimensions(
  aspectRatio: number,
  containerWidth: number
): { width: number; height: number } {
  return {
    width: containerWidth,
    height: containerWidth / aspectRatio,
  };
}

/**
 * Optimize image for different use cases
 */
export function getOptimizedImageForUseCase(
  url: string,
  useCase: 'thumbnail' | 'card' | 'hero' | 'full'
): string {
  const configs = {
    thumbnail: { width: 100, height: 100, quality: 70 },
    card: { width: 400, height: 300, quality: 80 },
    hero: { width: 1200, height: 600, quality: 85 },
    full: { width: 1920, quality: 90 },
  };
  
  const config = configs[useCase];
  return getOptimizedImageUrl(url, {
    ...config,
    format: 'webp',
  });
}
