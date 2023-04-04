import { ConfirmPrompt } from '@clack/core';
import { confirm, intro, spinner } from '@clack/prompts';
import { spawn } from 'child_process';


intro('Welcome to Community Traffic Counter');

async function main() {
    process.chdir('../cstc-backend/app/src/');

    const shouldContinue = await confirm({
        message: 'Do you want to start running the Traffic Counter?',
    });
    
    if (shouldContinue) {
        await confirm({
            message: 'Do you want to export data to this device?',
        });
    
        const s = spinner();

        s.start('Traffic Counter start running');

        const py = spawn('python', ['main.py', '--config', 'config.yaml']);

        py.stdout.on('data', (data) => {
            console.log(`\n${data}\n`);
        });

        py.stderr.on('data', (data) => {
            console.log(`\n${data}\n`);
        });

        py.on('close', () => {
            s.stop('Traffic Counter stopped');
        });

        const p = new ConfirmPrompt({
            render() {
                return `Press Enter to terminate the Traffic Counter`;
            },
        });

        await p.prompt();
        
        py.kill('SIGKILL');
    }
}

main();
