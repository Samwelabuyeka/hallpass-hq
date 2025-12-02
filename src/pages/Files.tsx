
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFileUpload, UploadedFile } from "@/hooks/use-file-upload";
import { Upload, Trash2, Download, File as FileIcon, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Files() {
    const { files, loading, uploading, uploadFile, deleteFile } = useFileUpload();
    const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadFile(file);
        }
    };

    const handleUploadClick = () => {
        fileInput?.click();
    };

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-8 pt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>My Files</CardTitle>
                        <CardDescription>Manage your uploaded files.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input 
                            type="file" 
                            className="hidden" 
                            ref={(input) => setFileInput(input)}
                            onChange={handleFileChange}
                        />
                        <Button onClick={handleUploadClick} disabled={uploading}>
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {uploading ? "Uploading..." : "Upload File"}
                        </Button>
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardContent className="p-4 flex flex-col items-center justify-center h-48">
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                            <div className="w-24 h-4 mt-2 bg-gray-200 rounded"></div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : files.map((file) => (
                                <Card key={file.id}>
                                    <CardContent className="p-4 flex flex-col items-center justify-center">
                                        <FileIcon className="w-16 h-16 text-gray-400" />
                                        <p className="mt-2 text-sm font-medium truncate w-full text-center">{file.name}</p>
                                        <div className="mt-2 flex gap-2">
                                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" variant="outline"><Download className="h-4 w-4" /></Button>
                                            </a>
                                            <Button size="sm" variant="destructive" onClick={() => deleteFile(file.name)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
