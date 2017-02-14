const fs = require('fs');
const p = require('path');
const lockfile = require('proper-lockfile');
const queue = require('queue');

const queues = new Map();

module.exports = (file, data, options = { encoding: 'utf8' }) => {
    const path = p.resolve(file);

    return new Promise((resolve, reject) => {
        addToQueue(path, cb => {
            lockfile.lock(path, (err, release) => {
                if(err) return reject(err);

                // read/write depending on arguments
                if(typeof data !== 'undefined')
                    fs.writeFile(path, (typeof data === 'string' || data instanceof Buffer) ? data : JSON.stringify(data), options, complete);
                else
                    fs.readFile(path, options, complete);

                function complete(err, data) {
                    release();
                    cb();

                    if(err) reject(err);
                    else resolve(data);
                }
            });
        });
    });
};

function addToQueue(path, func) {
    let q;
    if(queues.has(path))   {
        q = queues.get(path);
        q.push(func);
    }   else    {
        q = queue({
            concurrency: 1
        });
        q.push(func);
        queues.set(path, q);
        q.start();

        q.once('success', () => queues.delete(path));
        q.once('error', () => queues.delete(path));
    }
}