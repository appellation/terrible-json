const fs = require('fs');
const p = require('path');
const lockfile = require('proper-lockfile');
const queue = require('queue');

class QueueManager  {
    constructor()   {
        this.queues = new Map();
    }

    add(path, func) {
        let q;
        if(this.queues.has(path))   {
            q = this.queues.get(path);
            q.push(func);
        }   else    {
            q = queue({
                concurrency: 1
            });
            q.push(func);
            this.queues.set(path, q);
            q.start();

            q.once('success', () => this.queues.delete(path));
            q.once('error', () => this.queues.delete(path));
        }
    }
}

const manager = new QueueManager();

module.exports = (file, data, options = { encoding: 'utf8' }) => {
    const path = p.resolve(file);

    return new Promise((resolve, reject) => {
        manager.add(path, cb => {
            lockfile.lock(path, (err, release) => {
                if(err) return reject(err);

                // read/write depending on arguments
                if(typeof data !== 'undefined')
                    fs.writeFile(path, (typeof data === 'string' || data instanceof Buffer) ? data : JSON.stringify(data), options, complete);
                else
                    fs.readFile(path, options, complete);

                function complete(err, data) {
                    if(err) reject(err);
                    else resolve(data);

                    release();
                    cb();
                }
            });
        });
    });
};