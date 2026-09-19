import JSZip from 'jszip';

export interface ZipFileItem {
  name: string;
  url: string;
}

/**
 * Triggers a browser download using a Blob and anchor element.
 * Delays URL.revokeObjectURL to avoid premature cancellation by browser download engines.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.style.position = 'fixed';
  link.style.left = '-9999px';
  link.style.top = '-9999px';
  link.style.opacity = '0';
  document.body.appendChild(link);

  try {
    link.click();
  } catch {
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(clickEvent);
  }

  // Preserve the blob URL for 60 seconds so the browser download engine has time to read it
  setTimeout(() => {
    try {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Ignore cleanup errors
    }
  }, 60000);
}

/**
 * Robustly converts an image URL (data URI, local relative URL, or remote CORS URL) to a Blob.
 */
export async function fetchImageBlob(url: string): Promise<Blob> {
  // 1. Data URI handling
  if (url.startsWith('data:')) {
    try {
      const res = await fetch(url);
      return await res.blob();
    } catch {
      const parts = url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    }
  }

  // 2. Direct fetch
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      return await response.blob();
    }
  } catch (err) {
    console.warn(`Direct fetch failed for ${url}, trying canvas fallback:`, err);
  }

  // 3. Fallback via Image element and Canvas
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 1066;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          0.96
        );
      } catch (canvasErr) {
        reject(canvasErr);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    img.src = url;
  });
}

/**
 * Downloads a single image to the user's computer directly as a file.
 */
export async function downloadSingleImage(
  imageUrl: string,
  filename: string,
  onStatusChange?: (status: string) => void
): Promise<boolean> {
  try {
    if (!imageUrl) {
      throw new Error('URL da imagem não informada.');
    }

    let cleanName = (filename || 'foto_final.jpg').trim();
    if (!cleanName.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
      cleanName += '.jpg';
    }

    if (onStatusChange) onStatusChange('Baixando...');

    try {
      const blob = await fetchImageBlob(imageUrl);
      triggerBrowserDownload(blob, cleanName);
      if (onStatusChange) onStatusChange('Download concluído!');
      return true;
    } catch (blobErr) {
      console.warn('Falha ao obter Blob da imagem, tentando download direto:', blobErr);
    }

    // Direct fallback for same-origin or reachable links
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = cleanName;
    link.style.position = 'fixed';
    link.style.opacity = '0';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) document.body.removeChild(link);
    }, 5000);

    if (onStatusChange) onStatusChange('Download concluído!');
    return true;
  } catch (err) {
    console.error('Erro ao baixar imagem:', err);
    if (onStatusChange) onStatusChange('Erro no download.');
    return false;
  }
}

/**
 * Compresses multiple images into a ZIP archive and triggers a browser download.
 */
export async function downloadImagesAsZip(
  items: ZipFileItem[],
  zipFilename: string,
  onProgress?: (progressText: string) => void
): Promise<boolean> {
  try {
    if (!items || items.length === 0) {
      if (onProgress) onProgress('Nenhuma imagem para compactar.');
      return false;
    }

    const zip = new JSZip();
    const folderName = zipFilename.replace(/\.zip$/i, '');
    const folder = zip.folder(folderName) || zip;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (onProgress) {
        onProgress(`Baixando foto ${i + 1} de ${items.length}...`);
      }

      try {
        const blob = await fetchImageBlob(item.url);

        let cleanName = item.name.trim();
        if (!cleanName.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
          cleanName += '.jpg';
        }
        // Avoid duplicate file names inside zip
        const safeName = `${String(i + 1).padStart(2, '0')}_${cleanName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        folder.file(safeName, blob);
      } catch (err) {
        console.warn(`Erro ao baixar imagem ${item.name}:`, err);
        // Fallback: create a placeholder text info if download failed completely
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

    const safeZipName = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;

    // Trigger download in browser using persistent object URL
    triggerBrowserDownload(content, safeZipName);

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

