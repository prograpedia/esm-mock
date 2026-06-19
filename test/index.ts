import { mock } from '../src/index.js';
import { describe, it } from 'node:test';
import sinon from 'sinon';
import { expect } from 'chai';
import * as worker_threads from 'node:worker_threads';

const WorkerStub = sinon.stub();

describe('node-esm-mock', () => {
  describe('mock', () => {
    it('Worker should be WorkerStub', async () => {
      const { Worker } = await mock({
        'node:worker_threads': {
          Worker: WorkerStub,
        }
      }).for<typeof import('../utils/mockable.js')>('../utils/mockable.js');
      expect(Worker).to.be.equal(WorkerStub);
    })
    it('Worker should be worker_threads.Worker', async () => {
      const { Worker } = await mock().for<typeof import('../utils/mockable.js')>('../utils/mockable.js');
      expect(Worker).to.be.equal(worker_threads.Worker);
    })
  });

  describe('worker.js', () => {
    it('should call worker with ../worker.js and mocked', async () => {
      const { run, Worker } = await mock({
        'node:worker_threads': { Worker: WorkerStub },
      }).for<typeof import('../utils/mockable.js')>('../utils/mockable.js');
      const value = run();
      expect(WorkerStub.calledWithNew()).to.be.true;
      expect(WorkerStub.firstCall.args[0]).to.be.equal('./utils/worker.js');
      expect(value).to.be.instanceof(WorkerStub);
    })
    it('should call worker with ../worker.js', async () => {
      const { run } = await mock().for<typeof import('../utils/mockable.js')>('../utils/mockable.js');
      const value = run();
      expect(value).to.be.instanceof(worker_threads.Worker);
    })
  })
})
