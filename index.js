const fs = require('fs');
const p = require('path');
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

module.exports = (file, data, options) => {
    const json = (typeof data === 'string') ? data : JSON.stringify(data);
    const path = p.resolve(file);

    return new Promise((resolve, reject) => {
        manager.add(path, cb => {
            fs.writeFile(path, json, (err) => {
                if(err) reject(err);
                else resolve();
                cb();
            });
        });
    });
};