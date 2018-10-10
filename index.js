const fsn = require('fs-nextra');
const sem = require('semaphore')(1);
const lockfile = require('proper-lockfile');

const take = () => new Promise(r => sem.take(r));

module.exports = async (file, data, options) => {
	await take();
	const release = await lockfile.lock(file);

	async function complete(d) {
		await release();
		sem.leave();
		return d;
	}

	// read/write depending on arguments
	if (typeof data === 'undefined') return fsn.readJSON(file, options).then(complete);
	return fsn.writeJSON(file, data, options).then(complete);
};
