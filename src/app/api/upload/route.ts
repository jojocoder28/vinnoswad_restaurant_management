
import { NextRequest, NextResponse } from 'next/server';
import multer from 'multer';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';

// Disable Next.js body parsing to handle multipart/form-data with multer
export const config = {
    api: {
        bodyParser: false,
    },
};

// Promisify multer to use it with async/await
const uploadMiddleware = (req: any, res: any) => {
    const upload = multer().single('file'); // 'file' should match the name attribute in your form's file input
    return new Promise<void>((resolve, reject) => {
        upload(req, res, (err: any) => {
            if (err) {
                console.error("Multer error:", err);
                return reject(new Error('File upload error: ' + err.message));
            }
            resolve();
        });
    });
};

export async function POST(req: NextRequest) {
    try {
        // We need to cast req to 'any' to make it compatible with multer, which expects Express.js types
        const anyReq = req as any;
        await uploadMiddleware(anyReq, {} as any);

        if (!anyReq.file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        const file = anyReq.file;

        // Upload to Cloudinary from buffer
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'vinnoswad_menu', // Optional: organize uploads in a folder
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(new Error('Cloudinary upload failed'));
                    }
                    if (result) {
                        resolve(NextResponse.json({ url: result.secure_url }));
                    } else {
                        reject(new Error('Cloudinary upload failed to return a result.'));
                    }
                }
            );
            
            const readableStream = new Readable();
            readableStream.push(file.buffer);
            readableStream.push(null); // Signal the end of the stream
            readableStream.pipe(uploadStream);
        });

    } catch (error) {
        console.error("API Route error:", error);
        const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
