import busboy from 'busboy';
export default defineEventHandler(async (event) => {
    const req = event.node.req;
    const bb = busboy({
        headers: req.headers,
        fileHwm: 1024 * 256,
        limits: { fileSize: 1024 * 512 },
    });
    const result = await new Promise<{
        fields: { [item: string]: any };
        files: { [item: string]: { buffer: Buffer; fileInfo: busboy.FileInfo } };
    }>((resolve, reject) => {
        const fields: { [item: string]: any } = {};
        const files: {
            [item: string]: { buffer: Buffer; fileInfo: busboy.FileInfo };
        } = {};
        bb.on('file', (name, file, info) => {
            const _buf: any = [];
            file.on('data', (chunk) => _buf.push(chunk));
            file.on('end', () => {
                files[name] = { buffer: Buffer.concat(_buf), fileInfo: info };
                fields[name] = 'file';
            });
            file.on('close', () => {
                files[name] = { buffer: Buffer.concat(_buf), fileInfo: info };
                fields[name] = 'file';
            });
            file.on('error', (err) => reject(err));
        });
        bb.on('field', (name, val, info) => {
            fields[name] = val;
        });
        bb.on('close', () => {
            resolve({ fields, files });
        });
        bb.on('finish', () => {
            resolve({ fields, files });
        });
        bb.on('error', (e) => {
            reject(e);
        });
        req.pipe(bb);
    });
    return result;
})