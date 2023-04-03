import busboy from 'busboy';
export default defineEventHandler(async (event) => {
    try {
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
            try {
                const fields: { [item: string]: any } = {};
                const files: {
                    [item: string]: { buffer: Buffer; fileInfo: busboy.FileInfo };
                } = {};
                bb.on('file', (name, file, info) => {
                    try {
                        const _buf: any = [];
                        file.on('pause', () => {
                            bb.emit('error', 'PAUSED on file')
                        })
                        file.on('data', (chunk) => { try { _buf.push(chunk) } catch (e) { bb.emit(e) } });
                        file.on('end', () => {
                            try {
                                files[name] = { buffer: Buffer.concat(_buf), fileInfo: info };
                                fields[name] = 'file';
                            } catch (e) { bb.emit(e) }
                        });
                        file.on('close', () => {
                            try {
                                files[name] = { buffer: Buffer.concat(_buf), fileInfo: info };
                                fields[name] = 'file';
                            } catch (e) { bb.emit(e) }
                        });
                        file.on('error', (err) => reject(err));
                    }
                    catch (e) {
                        bb.emit('error', e)
                    }
                });
                bb.on('field', (name, val, info) => {
                    try {
                        fields[name] = val;
                    }
                    catch (e) {
                        bb.emit('error', e)
                    }
                });
                bb.on('fieldsLimit', () => bb.emit('error', 'fieldsLimit'))
                bb.on('filesLimit', () => bb.emit('error', 'filesLimit'))
                bb.on('partsLimit', () => bb.emit('error', 'partsLimit'))
                bb.on('close', () => {
                    resolve({ fields, files });
                });
                bb.on('finish', () => {
                    resolve({ fields, files });
                });
                bb.on('error', (e) => {
                    reject(e);
                });
                req.pipe(bb, { end: true })
            } catch (e) {
                reject(e);
            }
        });
        return result;
    }
    catch (e) {
        return e;
    }

})