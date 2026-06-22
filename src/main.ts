import { registerSW } from 'virtual:pwa-register';
import { bootstrap } from './app';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Update available');
  },
  onOfflineReady() {
    console.log('Offline ready');
  },
});

bootstrap().catch((error) => {
  console.error('Failed to start app:', error);
});
