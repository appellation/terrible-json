const ipc = require('node-ipc');
require('./process');

ipc.config.id = process.pid;
ipc.connectTo('terrible_json');

let id = 0;

module.exports = (file, data, options = { encoding: 'utf8'}) => {
    const thisID = id++;
    ipc.of.terrible_json.emit(
        data ? 'write' : 'read',
        {
            id: thisID,
            path: file,
            data,
            options
        }
    );

    return new Promise(resolve => {
        ipc.of.terrible_json.on(
            'complete',
            response => {
                if(response.id === thisID) resolve(response.data);
            }
        )
    });
};