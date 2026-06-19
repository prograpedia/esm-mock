import { mock } from '../src/index.js';
import { describe, it } from "node:test";
import * as assert from "node:assert";
import sinon from "sinon";
import * as worker_threads from "node:worker_threads";

const WorkerStub = sinon.stub();

describe('esm-mock', () => {
    let mockedWorkerThreads: typeof worker_threads;
    describe('mock', () => {
        it('Worker should be WorkerStub', async () => {
            const { Worker } = await mock({
                'node:worker_threads': {
                    Worker: WorkerStub,
                }
            }).for<typeof import('../utils/mockable.js')>('../utils/mockable.js');
            assert.equal(Worker, WorkerStub);
        })
        it('Worker should be worker_threads.Worker', async () => {
            const { Worker } = await mock().for('../utils/mockable.js');
            assert.equal(Worker, worker_threads.Worker);
        })
    });

    describe('worker.js', () => {
        it('should call worker with ../worker.js', async () => {
            const { run } = await mock({
                'node:worker_threads': { Worker: WorkerStub },
            }).for('../utils/mockable.js');
            const value = run();
            assert.equal(WorkerStub.calledWithNew(), true);
            assert.equal(WorkerStub.firstCall.args[0], './utils/worker.js');
            assert.ok(value instanceof WorkerStub, 'worker should be a WorkerStub instance');
        })
        it('should call worker with ../worker.js', async () => {
            const { run } = await mock().for('../utils/mockable.js');
            const value = run();
            assert.ok(value instanceof worker_threads.Worker, 'worker worker should be a worker_threads.Worker instance');
        })
    })
})