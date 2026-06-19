import { Worker } from 'worker_threads';

export function run() {
    return new Worker('./utils/worker.js', {});
}

export { Worker };