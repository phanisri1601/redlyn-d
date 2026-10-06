import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['--env-file=.env','--test','--test-concurrency=1',...process.argv.slice(2),'tests/security.test.mjs','tests/integrations.test.mjs','tests/firebase.test.mjs'],{
  env:{...process.env,RUN_FIREBASE_TESTS:'1'},stdio:'inherit',
});
child.on('exit',code=>{process.exitCode=code??1;});
