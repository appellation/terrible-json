const ipc = require('node-ipc');
const {fork} = require('child_process');

ipc.config.id = process.pid;
ipc.connectTo('terrible_json');

let id = 0;

module.exports = (file, data, options = { encoding: 'utf8'}) => {
    const thisID = id++;
    ipc.of.terrible_json.emit(
        typeof data === 'undefined' ? 'write' : 'read',
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
module.exports.init = () => fork('./process');