// Developer profile shown in the About page and sidebar footer.
// Links with an empty `url` are simply not rendered, so it is safe to leave
// a field blank until you have the real handle.

export const PROFILE = {
  name: 'Sourabh Kumar',
  role: 'Backend Developer',
  tagline: 'I build tools to remove the small daily frictions of backend work.',
  bio: `Toolbelt started as a scratch-your-own-itch project: too many browser tabs open on
formatter sites, cron decoders and "what does HTTP 409 mean again?" references — most of
them slow, ad-heavy, or quietly uploading whatever you paste. So this one runs entirely in
your browser. No backend, no analytics, no network calls. Your data never leaves the tab.`,
  location: 'India',
  // Served from public/ — WebP with a JPEG fallback for older browsers.
  avatar: { webp: './sourabh.webp', jpg: './sourabh.jpg' },
  links: [
    { id: 'linkedin', label: 'LinkedIn', handle: 'Sourabh Kumar', url: 'https://www.linkedin.com/in/sourabh-kumar-12859374/' },
    { id: 'medium', label: 'Medium', handle: '@sourabhh', url: 'https://medium.com/@sourabhh' },
    // Add your Instagram handle and URL here and it appears automatically.
    { id: 'instagram', label: 'Instagram', handle: '', url: '' },
  ],
}

export const SITE_URL = 'https://sourabh.site'

export const activeLinks = () => PROFILE.links.filter((l) => l.url && l.handle)
