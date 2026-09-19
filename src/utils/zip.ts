import JSZip from 'jszip';

export interface ZipFileItem {
  name: string;
  url: string;
}

export async function downloadImagesAsZip(
  items: ZipFileItem[],
  zipFilename: string,
  onProgress?: (progressText: string) => void
): Promise<boolean> {
  try {
    const zip = new JSZip();
    const folderName = zipFilename.replace(/\.zip$/i, '');
    const folder = zip.folder(folderName) || zip;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (onProgress) {
        onProgress(`Baixando foto ${i + 1} de ${items.length}...`);
      }

      try {
        let blob: Blob;

        if (item.url.startsWith('data:')) {
          // Handle base64 data uri
          const parts = item.url.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          blob = new Blob([u8arr], { type: mime });
        } else {
          // Fetch remote url
          const response = await fetch(item.url, { mode: 'cors' });
          if (!response.ok) {
            throw new Error(`Falha HTTP ${response.status}`);
          }
          blob = await response.blob();
        }

        let cleanName = item.name.trim();
        if (!cleanName.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
          cleanName += '.jpg';
        }
        // Avoid duplicate file names inside zip
        const safeName = `${String(i + 1).padStart(2, '0')}_${cleanName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        folder.file(safeName, blob);
      } catch (err) {
        console.warn(`Erro ao baixar imagem ${item.name}:`, err);
        // Fallback: create a placeholder text info if download failed due to CORS
        folder.file(`${String(i + 1).padStart(2, '0')}_${item.name}.txt`, `Link original: ${item.url}`);
      }
    }

    if (onProgress) {
      onProgress('Compactando arquivo .zip...');
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Trigger download in browser
    const downloadUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    if (onProgress) {
      onProgress('Download concluído!');
    }
    return true;
  } catch (error) {
    console.error('Erro ao gerar arquivo zip:', error);
    if (onProgress) {
      onProgress('Erro ao gerar o arquivo zip.');
    }
    return false;
  }
}
