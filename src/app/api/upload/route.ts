
import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Cloudinary from buffer
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'vinnoswad_menu',
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
            readableStream.push(buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        });

    } catch (error) {
        console.error("API Route error:", error);
        const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
