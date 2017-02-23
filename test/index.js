const {fork} = require('child_process');
const badJSON = require('../index');
badJSON.init();

setTimeout(() => {
    fork('./test/op');
    fork('./test/op');
}, 5000);
