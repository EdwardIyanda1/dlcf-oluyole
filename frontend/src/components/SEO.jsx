import { useEffect } from 'react';

const SITE_NAME = 'DLCF Oluyole Region Retreat';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Sets a unique <title> and description/OG meta for the current route.
 * Restores the previous title on unmount so navigating away never leaves
 * a stale tab title behind.
 */
export default function SEO({ title, description, noindex = false }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    if (description) {
      setMeta('description', description);
      setMeta('og:title', document.title, 'property');
      setMeta('og:description', description, 'property');
    }
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, noindex]);

  return null;
}
