const axios = require('axios');
const unfluff = require('unfluff');

const parseUrlContent = async (url) => {
  try {
    // Fetch raw HTML with proper headers
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000,
      maxRedirects: 5
    });

    // Extract using unfluff - suppress warnings temporarily
    const originalWarn = console.warn;
    console.warn = () => {}; // Temporarily disable warnings
    
    const parsed = unfluff(html, url);
    
    console.warn = originalWarn; // Restore original console.warn

    // Extract date from HTML meta tags or parsed data
    let publishedAt = null;
    try {
      if (parsed.date) {
        publishedAt = new Date(parsed.date).toISOString();
      } else {
        // Try to extract from common meta tags
        const dateRegex = /<meta[^>]*(?:property="(?:article:published_time|og:updated_time|publishdate|datePublished)"|name="(?:date|pubdate|published|article:published_time)")[^>]*content="([^"]+)"/i;
        const dateMatch = html.match(dateRegex);
        if (dateMatch && dateMatch[1]) {
          publishedAt = new Date(dateMatch[1]).toISOString();
        }
      }
    } catch (dateError) {
      console.warn('Date parsing error:', dateError.message);
    }

    // Extract language
    let language = 'en';
    try {
      const langMatch = html.match(/<html[^>]*lang="([^"]+)"/i);
      if (langMatch && langMatch[1]) {
        language = langMatch[1].substring(0, 2);
      }
    } catch (langError) {
      console.warn('Language detection error:', langError.message);
    }

    // Extract image
    let image = parsed.image;
    if (!image && parsed.links && parsed.links.length > 0) {
      // Look for og:image or similar
      const imgMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      if (imgMatch && imgMatch[1]) {
        image = imgMatch[1];
      }
    }

    // Extract author with better fallback - ensure it's always a string
    let author = parsed.author;
    
    // If author is an array, extract the name part (not URL)
    if (Array.isArray(author)) {
      author = author.find(item => !item.startsWith('http')) || author[0] || '';
    }
    
    if (!author) {
      const authorMatch = html.match(/<meta[^>]*(?:property="article:author"|name="author")[^>]*content="([^"]+)"/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1];
      }
    }
    
    // Ensure author is always a string
    author = String(author || '').trim();

    // Extract subtitle/description
    let subtitle = parsed.description;
    if (!subtitle) {
      const descMatch = html.match(/<meta[^>]*(?:property="og:description"|name="description")[^>]*content="([^"]+)"/i);
      if (descMatch && descMatch[1]) {
        subtitle = descMatch[1];
      }
    }

    return {
      title: parsed.title || '',
      subtitle: subtitle || '',
      summary: parsed.description || (parsed.text ? parsed.text.substring(0, 200) + '...' : ''),
      fullContent: parsed.text || '',
      author: author || '',
      publishedAt: publishedAt || new Date().toISOString(),
      language: language,
      image: image || '',
      tags: parsed.keywords || [],
      contentType: 'news'
    };
  } catch (err) {
    console.error('Parser error:', err.message);
    // Return default values instead of null to prevent errors
    return {
      title: '',
      subtitle: '',
      summary: '',
      fullContent: '',
      author: '',
      publishedAt: new Date().toISOString(),
      language: 'en',
      image: '',
      tags: [],
      contentType: 'news'
    };
  }
};

module.exports = { parseUrlContent };
