import { cancel, confirm, intro, isCancel, spinner, select, text } from '@clack/prompts';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';


const yaml = require('yaml');


intro('Welcome to Community Traffic Counter (Press Ctrl + C to exist)');

async function main() {
    const shouldContinue = await confirm({
        message: 'Do you want to start running the Traffic Counter?',
    });
    if (isCancel(shouldContinue)) {
        cancel('Operation cancelled.');
        return;
    }

    const version = await select({
        message: 'Select a version to run.',
        options: [
            { value: 'v5', label: 'YOLOv5' },
            { value: 'v7', label: 'YOLOv7' },
        ]
    });

    if (isCancel(version)) {
        cancel('Operation cancelled.');
        return;
    }

    const srcFolder = `../cstc-backend-${version}/app/src`;
    process.chdir(srcFolder);

    const config = readFileSync('config.yaml', 'utf-8');
    const data = yaml.parse(config);

    const mediaSource = await text({
        message: 'Source of the video (absolute path to a file or a URL link)',
        placeholder: 'test.mp4',
        initialValue: 'test.mp4',
        validate(value) {
            if (value.length === 0) return `Value is required!`;
        },
    });
    if (isCancel(mediaSource)) {
        cancel('Operation cancelled.');
        return;
    }

    const uploadPeriod = await text({
        message: 'How long do you want to wait for each upload (in seconds)?',
        placeholder: '60',
        initialValue: '60',
        validate(value) {
            if (value.length === 0) return `Value is required!`;
        },
    });
    if (isCancel(uploadPeriod)) {
        cancel('Operation cancelled.');
        return;
    }

    const legacy = await confirm({
        message: 'Do you want to run in legacy mode (For old system and low end hardware)?'
    });
    if (isCancel(legacy)) {
        cancel('Operation cancelled.');
        return;
    }

    const saveCSV = await confirm({
         message: 'Do you want to export data to this device?',
    });
    if (isCancel(saveCSV)) {
        cancel('Operation cancelled.');
        return;
    }

    data['input_config']['init_args']['media_source'] = mediaSource;
    data['output_result_config']['init_args']['upload_period'] = parseInt(uploadPeriod);
    data['output_result_config']['init_args']['save_csv'] = saveCSV;
    data['legacy'] = legacy;
    
    const newConfig = yaml.stringify(data);

    writeFileSync('config.yaml', newConfig, {encoding: 'utf-8', flag: 'w'});

    const s = spinner();

    s.start('Traffic Counter start running; Press any key to terminate the process');

    const py = spawn('python3', ['main.py', '--config', 'config.yaml']);

    py.stderr.on('data', (data) => {
        console.log(`\n${data}\n`);
    });

    py.on('close', () => {
       s.stop('Traffic Counter stopped');
    });

    const c = await confirm({
        message: ''
    });
    if (isCancel(c)) {
        py.kill('SIGKILL');
        return;
    }
        
    py.kill('SIGKILL');
}

main();
