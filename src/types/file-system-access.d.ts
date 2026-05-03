// Minimal ambient declarations for the File System Access API
// (not yet in TypeScript's built-in lib.dom.d.ts for all browsers)

interface FileSystemPermissionDescriptor {
    mode: 'read' | 'readwrite';
}

interface FileSystemDirectoryHandle {
    getFileHandle(
        name: string,
        options?: { create?: boolean }
    ): Promise<FileSystemFileHandle>;
    queryPermission(
        descriptor: FileSystemPermissionDescriptor
    ): Promise<PermissionState>;
    requestPermission(
        descriptor: FileSystemPermissionDescriptor
    ): Promise<PermissionState>;
}

interface FileSystemFileHandle {
    createWritable(options?: {
        keepExistingData?: boolean;
    }): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    close(): Promise<void>;
}

interface Window {
    showDirectoryPicker(options?: {
        mode?: 'read' | 'readwrite';
        startIn?: string;
        id?: string;
    }): Promise<FileSystemDirectoryHandle>;
}
