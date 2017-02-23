const ipc = require('node-ipc');
const {fork} = require('child_process');
const uuid = require('uuid');

const resolutions = new Map();

ipc.config.id = process.pid;
ipc.config.silent = true;

ipc.connectTo('terrible_json', () => {
    ipc.of.terrible_json.on(
        'complete',
        response => {
            if(resolutions.has(response.id)) {
                resolutions.get(response.id).resolve(response.data);
                resolutions.delete(response.id);
            }
        }
    );

    ipc.of.terrible_json.on(
        'error',
        response => {
            if(resolutions.has(response.id)) {
                resolutions.get(response.id).reject(response.error);
                resolutions.delete(response.id);
            }
        }
    );
});

module.exports = (file, data, options = { encoding: 'utf8'}) => {
    const thisID = uuid.v4();
    ipc.of.terrible_json.emit(
        (typeof data === 'undefined') ? 'read' : 'write',
        {
            id: thisID,
            path: file,
            data,
            options
        }
    );

    return new Promise((resolve, reject) => {
        resolutions.set(thisID, { resolve, reject });
    });
};

module.exports.init = () => fork('./process');