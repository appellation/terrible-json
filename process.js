const ipc = require('node-ipc');
const fs = require('fs');
const lockfile = require('proper-lockfile');
const queue = require('queue');
const {ReadableStream} = require('stream');

const queues = new Map();

ipc.config.id = 'terrible_json';
ipc.config.silent = true;

ipc.serve(
    () => {
        ipc.server.on(
            'read',
            (data, socket) => accessFile(data, socket, 'read')
        );

        ipc.server.on(
            'write',
            (data, socket) => accessFile(data, socket, 'write')
        );
    }
);

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

function accessFile(inc, socket, type) {

    addToQueue(inc.path, cb => {
        lockfile.lock(inc.path, (err, release) => {
            if(err) return emitError(socket, err);
            // read/write depending on arguments
            if(type === 'write') {
                if(inc.data instanceof ReadableStream) {
                    const write = fs.createWriteStream(inc.path, inc.options);
                    write.once('finish', () => complete());
                    inc.data.pipe(write);
                } else {
                    const toWrite = (typeof inc.data === 'string' || inc.data instanceof Buffer) ? inc.data : JSON.stringify(inc.data);
                    fs.writeFile(inc.path, toWrite, inc.options, complete);
                }
            }
            else if(type === 'read')
                fs.readFile(inc.path, inc.options, complete);
            else
                complete(new Error(`Invalid operation type specified: ${type}`));

            function complete(err, result) {
                release();
                cb();

                if(err) return emitError(socket, err);

                ipc.server.emit(
                    socket,
                    'complete',
                    {
                        id: inc.id,
                        data: result,
                        path: inc.path
                    }
                );
            }
        });
    });
}

function emitError(socket, err) {
    ipc.server.emit(
        socket,
        'error',
        err
    );
}

ipc.server.start();