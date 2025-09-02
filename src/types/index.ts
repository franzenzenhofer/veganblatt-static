export interface Article {
  title: string;
  slug: string;
  date?: string;
  excerpt?: string;
  featuredImage?: string;
  content: string;
}

export interface Recipe extends Article {
  recipe?: {
    prepTime?: string;
    cookTime?: string;
    servings?: string;
    ingredients?: string[];
    instructions?: string[];
    notes?: string;
  };
}

export interface ImageMetadata {
  altText?: string;
  copyright?: string;
  width?: number;
  height?: number;
}

export interface GenerationStats {
  articlesProcessed: number;
  recipesProcessed: number;
  imagesProcessed: number;
  brokenLinks: number;
  startTime: Date;
  endTime?: Date;
}

export interface SiteConfig {
  srcDir: string;
  publicDir: string;
  testMode: boolean;
  testCount: number;
  imageMetadataDir: string;
}