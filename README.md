# Terrible JSON
This module simply assures that your precious files will never get accessed for concurrent reads and writes.

```js
const badJSON = require('terrible-json');

badJSON('./bad.json', { some: 'data' });
badJSON('./bad.json', { some: 'other', data: 'lol'});
badJSON('./bad.json').then(console.log);
badJSON('./bad.json', { other: 'data' });
```