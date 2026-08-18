export default {
  plugins: {
    // Tailwind 4 ships its own PostCSS plugin and vendor-prefixes through
    // Lightning CSS, so autoprefixer is no longer part of this pipeline.
    '@tailwindcss/postcss': {},
  },
}
