const badJSON = require('../index');

badJSON('./test/bad.json', {lol: 'no'});
badJSON('./test/bad.json', {lol: 'maybe'});
badJSON('./test/bad.json').then(console.log);
badJSON('./test/bad.json', {lmao: 'memes'});
badJSON('./test/bad.json').then(console.log);