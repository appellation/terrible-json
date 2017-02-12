const badJSON = require('../index');
badJSON('./test/bad.json', {lol: 'no'});
badJSON('./test/bad.json', {lol: 'yes'});
