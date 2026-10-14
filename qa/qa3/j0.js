const { open, dump } = require('./lib');
(async () => { const { b, p, errs } = await open(); console.log(JSON.stringify(await dump(p), null, 1)); console.log('errs', errs); await b.close(); })();
