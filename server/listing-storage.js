const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const IMAGE_TYPES = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
]);

function resolveUploadsPath(databasePath, environment = process.env) {
    const configuredPath = environment.UPLOADS_PATH?.trim();
    const uploadsPath = configuredPath
        ? path.resolve(__dirname, configuredPath)
        : path.join(path.dirname(databasePath), 'uploads');

    if (uploadsPath === path.parse(uploadsPath).root) {
        throw new Error('UPLOADS_PATH cannot point to a filesystem root');
    }

    fs.mkdirSync(uploadsPath, { recursive: true });
    return uploadsPath;
}

function createImageUpload(uploadsPath) {
    const storage = multer.diskStorage({
        destination: uploadsPath,
        filename(req, file, callback) {
            callback(null, `${randomUUID()}${IMAGE_TYPES.get(file.mimetype)}`);
        },
    });

    return multer({
        storage,
        limits: {
            fileSize: 5 * 1024 * 1024,
            files: 5,
            fields: 12,
            fieldSize: 20 * 1024,
        },
        fileFilter(req, file, callback) {
            if (!IMAGE_TYPES.has(file.mimetype)) {
                callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
                return;
            }
            callback(null, true);
        },
    });
}

function hasExpectedSignature(file) {
    const descriptor = fs.openSync(file.path, 'r');
    const signature = Buffer.alloc(12);
    try {
        fs.readSync(descriptor, signature, 0, signature.length, 0);
    } finally {
        fs.closeSync(descriptor);
    }

    if (file.mimetype === 'image/jpeg') {
        return signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
    }
    if (file.mimetype === 'image/png') {
        return signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    if (file.mimetype === 'image/webp') {
        return signature.subarray(0, 4).toString() === 'RIFF'
            && signature.subarray(8, 12).toString() === 'WEBP';
    }
    return false;
}

function removeFiles(files = []) {
    for (const file of files) {
        const filePath = typeof file === 'string' ? file : file.path;
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
}

function validateImageSignatures(files = []) {
    const invalidFile = files.find((file) => !hasExpectedSignature(file));
    if (!invalidFile) return;

    removeFiles(files);
    const error = new Error(`${invalidFile.originalname} is not a valid image file`);
    error.statusCode = 400;
    throw error;
}

function storedImageUrl(file, environment = process.env) {
    const prefix = (environment.IMAGE_URL_PREFIX || '/backend-api/uploads').replace(/\/$/, '');
    return `${prefix}/${file.filename}`;
}

function storedImagePath(imageUrl, uploadsPath, environment = process.env) {
    const prefix = (environment.IMAGE_URL_PREFIX || '/backend-api/uploads').replace(/\/$/, '');
    if (!imageUrl.startsWith(`${prefix}/`)) return null;

    const fileName = imageUrl.slice(prefix.length + 1);
    if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(fileName)) return null;
    return path.join(uploadsPath, fileName);
}

module.exports = {
    createImageUpload,
    removeFiles,
    resolveUploadsPath,
    storedImagePath,
    storedImageUrl,
    validateImageSignatures,
};
