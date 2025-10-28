import { ValkyrieMicroKernel } from './kernel/microKernel';

const kernel = new ValkyrieMicroKernel();
kernel.boot();

export { kernel };
