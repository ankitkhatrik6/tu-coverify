import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tucoverify.ankitak.com.np/',
      changeFrequency: 'daily',
      priority: 1,
    }
  ]
}
