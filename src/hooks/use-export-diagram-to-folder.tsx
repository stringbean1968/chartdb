import { useCallback, useEffect, useState } from 'react';
import { get, set, del } from 'idb-keyval';
import { diagramToJSONOutput } from '@/lib/export-import-utils';
import type { Diagram } from '@/lib/domain/diagram';
import { toast } from '@/components/toast/use-toast';

const DIR_HANDLE_KEY = 'chartdb-export-dir-handle';

export const useExportDiagramToFolder = () => {
    const isSupported =
        typeof window !== 'undefined' && 'showDirectoryPicker' in window;

    const [isLoading, setIsLoading] = useState(false);
    const [hasFolder, setHasFolder] = useState(false);

    useEffect(() => {
        if (!isSupported) return;
        get<FileSystemDirectoryHandle>(DIR_HANDLE_KEY)
            .then((handle) => setHasFolder(!!handle))
            .catch(() => setHasFolder(false));
    }, [isSupported]);

    const pickFolder = useCallback(async () => {
        if (!isSupported) return;
        try {
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite',
            });
            await set(DIR_HANDLE_KEY, handle);
            setHasFolder(true);
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            toast({
                title: 'Could not pick folder',
                description: err instanceof Error ? err.message : String(err),
                variant: 'destructive',
            });
        }
    }, [isSupported]);

    const clearFolder = useCallback(async () => {
        await del(DIR_HANDLE_KEY);
        setHasFolder(false);
    }, []);

    const exportToFolder = useCallback(
        async ({ diagram }: { diagram: Diagram }) => {
            if (!isSupported) return;
            setIsLoading(true);
            try {
                let dir = await get<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);

                if (!dir) {
                    try {
                        dir = await window.showDirectoryPicker({
                            mode: 'readwrite',
                        });
                        await set(DIR_HANDLE_KEY, dir);
                        setHasFolder(true);
                    } catch (err: unknown) {
                        if (err instanceof Error && err.name === 'AbortError')
                            return;
                        throw err;
                    }
                } else {
                    const permission = await dir.queryPermission({
                        mode: 'readwrite',
                    });
                    if (permission !== 'granted') {
                        const requested = await dir.requestPermission({
                            mode: 'readwrite',
                        });
                        if (requested !== 'granted') {
                            try {
                                dir = await window.showDirectoryPicker({
                                    mode: 'readwrite',
                                });
                                await set(DIR_HANDLE_KEY, dir);
                                setHasFolder(true);
                            } catch (err: unknown) {
                                if (
                                    err instanceof Error &&
                                    err.name === 'AbortError'
                                )
                                    return;
                                throw err;
                            }
                        }
                    }
                }

                const safeName =
                    diagram.name.replace(/[^A-Za-z0-9\-_]/g, '_') || 'diagram';
                const fileHandle = await dir.getFileHandle(`${safeName}.json`, {
                    create: true,
                });
                const writable = await fileHandle.createWritable();
                await writable.write(diagramToJSONOutput(diagram));
                await writable.close();
            } catch (err: unknown) {
                toast({
                    title: 'Export to folder failed',
                    description:
                        err instanceof Error ? err.message : String(err),
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        },
        [isSupported]
    );

    return {
        isSupported,
        isLoading,
        hasFolder,
        pickFolder,
        clearFolder,
        exportToFolder,
    };
};
