import { type Plugin } from "vite";

// Minimal stub plugin for meta images. Returns a no-op Vite plugin
// to satisfy the import during build on Render.
export function metaImagesPlugin(): Plugin {
  return {
    name: "meta-images-plugin-stub",
    enforce: "pre",
    config() {
      return {};
    },
  };
}
