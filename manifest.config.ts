// eslint-disable-next-line import-x/no-extraneous-dependencies
import { defineManifest } from '@crxjs/vite-plugin';

import packageJson from './package.json';

const { version, name, description } = packageJson;

const [major, minor, patch, label = '0'] = version
  .replace(/[^\d.-]+/g, '')
  .split(/[.-]/);

export default defineManifest(async () => ({
  name: name,
  description,
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  manifest_version: 3,
  icons: {
    16: 'public/icons/icon16.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },
  host_permissions: ['<all_urls>'],
  permissions: ['storage'],
  action: { default_popup: 'index.html' },
  background: {
    service_worker: 'src/background/index.ts',
  },
  content_scripts: [
    {
      all_frames: true,
      js: ['src/content.ts'],
      matches: ['http://*/*', 'https://*/*'],
      run_at: 'document_start',
    },
  ],
  web_accessible_resources: [
    {
      matches: ['<all_urls>'],
      resources: ['src/inpage/index.ts'],
    },
  ],
}));
