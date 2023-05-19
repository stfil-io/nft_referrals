import fs, {readFileSync, writeFileSync} from 'fs'
import {exec} from "child_process";
import {createInterface} from 'readline'

export interface IDeployments {
    whitelist: string;
    stableJumper: string;
    referral: string;
}

const pathToFolder = '/deployments'
const tempFileSuffix = '/deployments.json'

export const getDeploymentFilename = (networkName: string): string => {
    return process.cwd() + `${pathToFolder}/${networkName}${tempFileSuffix}`
}

export const fileExists = (file: string): boolean => {
    try {
        fs.accessSync(file, fs.constants.F_OK)
        return true
    } catch (e) {
        return false
    }
}

export const getDeploymentFile = (
    path: string
): IDeployments => {
    if (!fileExists(path)) {
        throw new Error(`Deployment file ${path} does not exist. Maybe contracts weren't deployed?`)
    }
    try {
        return JSON.parse(fs.readFileSync(path, 'utf8'))
    } catch (e) {
        throw new Error(`Failed to read ${path}. Maybe the file is badly generated?`)
    }
}

export const writeFile = async (filename: string, data: any) => {

    const directoryPath = filename.split('/').slice(0, -1).join('/');
    fs.mkdirSync(directoryPath, {recursive: true});

    /**
     * flags:
     *  - w = Open file for reading and writing. File is created if not exists
     *  - a+ = Open file for reading and appending. The file is created if not exists
     */
    writeFileSync(filename, data, {
        flag: 'w',
    });

    return readFileSync(filename, 'utf-8');
}

export async function sh(cmd: string) {
    return new Promise(function (resolve, reject) {
        const execProcess = exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err)
            } else {
                resolve({stdout, stderr})
            }
        })

        execProcess.stdout?.pipe(process.stdout)
    })
}

export const ask = (question: string): Promise<string> =>
    new Promise(resolve => {
        const terminal = createInterface({
            input: process.stdin,
            output: process.stdout
        })
        terminal.question(question, answer => {
            terminal.close()
            resolve(answer.trim())
        })
    })

