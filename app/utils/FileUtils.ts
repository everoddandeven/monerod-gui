import * as fs from 'fs';
import * as tar from 'tar';
import * as path from 'path';
import * as https from 'https';
import { createHash } from 'crypto';

const AdmZip = require('adm-zip');
const bz2 = require('unbzip2-stream');

export abstract class FileUtils {
    
    public static async downloadFile(url: string, destinationDir: string, onProgress: (progress: number) => void): Promise<string> {
        return new Promise((resolve, reject) => {
          const request = (url: string) => {
            https.get(url, (response) => {
              if (response.statusCode === 200) {
                const contentDisposition = response.headers['content-disposition'];
                let finalFilename = '';
      
                // Estrai il nome del file dall'URL o dal content-disposition
                if (contentDisposition && contentDisposition.includes('filename')) {
                  const match = contentDisposition.match(/filename="(.+)"/);
                  if (match) {
                    finalFilename = match[1];
                  }
                } else {
                  // Se non c'è content-disposition, prendiamo il nome dall'URL
                  finalFilename = url.split('/').pop() || 'downloaded-file';
                }
      
                const destination = `${destinationDir}/${finalFilename}`;
                let file: fs.WriteStream;
      
                try {
                  file = fs.createWriteStream(destination);
                  file.on('error', (error: Error) => {
                    console.log("file error: " + error);
                    reject(error);
                  });
                }
                catch (error: any) {
                  reject(error);
                  return;
                }
      
                const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
                let downloadedBytes = 0;
      
                response.on('data', (chunk) => {
                  downloadedBytes += chunk.length;
                  const progress = (downloadedBytes / totalBytes) * 100;
                  onProgress(progress); // Notifica il progresso
                });
      
                response.pipe(file);
      
                file.on('finish', () => {
                  file.close(() => resolve(finalFilename)); // Restituisci il nome del file finale
                });
              } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Se è un redirect, effettua una nuova richiesta verso il location header
                const newUrl = response.headers.location;
                if (newUrl) {
                  request(newUrl); // Ripeti la richiesta con il nuovo URL
                } else {
                  reject(new Error('Redirection failed without a location header'));
                }
              } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
              }
            }).on('error', (err) => {
              reject(err);
            });
          };
      
          request(url); // Inizia la richiesta
        });
      };

    public static async checkFileHash(filePath: string, hash: string): Promise<boolean> {
        const fileHash = await this.calculateFileHash(filePath);

        return fileHash === hash;
    }

    public static calculateFileHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
          const hash = createHash('sha256');
          const fileStream = fs.createReadStream(filePath);
      
          fileStream.on('data', (data) => {
            hash.update(data);
          });
      
          fileStream.on('end', () => {
            resolve(hash.digest('hex'));
          });
      
          fileStream.on('error', (err) => {
            reject(err);
          });
        });
    };

    //#region Extraction

    public static async extractTarBz2(filePath: string, destination: string): Promise<string> {
        return await new Promise((resolve, reject) => {
        // Crea il file decomprimendo il .bz2 in uno .tar temporaneo
        const tarPath = path.join(destination, 'temp.tar');
        const fileStream = fs.createReadStream(filePath);
        const decompressedStream = fileStream.pipe(bz2());
    
        const writeStream = fs.createWriteStream(tarPath);
    
        decompressedStream.pipe(writeStream);
    
        let extractedDir: string = '';
    
        writeStream.on('finish', () => {
            // Una volta che il file .tar è stato creato, estrailo
            tar.extract({ cwd: destination, file: tarPath, onReadEntry: (entry: tar.ReadEntry) => {
            if (extractedDir == '') {
                const topLevelDir = entry.path.split('/')[0];
                extractedDir = topLevelDir; // Salva la prima directory
            }
            } })
            .then(() => {
                // Elimina il file .tar temporaneo dopo l'estrazione
                fs.unlink(tarPath, (err) => {
                if (err) reject(err);
                else if (extractedDir == '') reject('Extraction failed')
                else resolve(extractedDir);
                });
            })
            .catch(reject);
        });
    
        writeStream.on('error', reject);
        });
    };
  
    public static async extractZip(filePath: string, destination: string): Promise<string> {
        return await new Promise<string>((resolve, reject) => {
        try {
            const zip = new AdmZip(filePath);
    
            // Ensure destination exists
            if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
            }
    
            // Extract the ZIP file
            zip.extractAllTo(destination, true);
    
            // Get the name of the extracted folder
            const extractedEntries = zip.getEntries();
            const folderName = extractedEntries[0]?.entryName.split('/')[0];
    
            // Ensure folder name exists
            if (!folderName) {
            reject(new Error("Could not determine the extracted folder name"));
            return;
            }
    
            resolve(path.join(destination, folderName));
        } catch (error) {
            reject(error);
        }
        });
    };
  
    public static async extract(filePath: string, destination: string): Promise<string> {
        if (filePath.endsWith('.zip')) {
        return await this.extractZip(filePath, destination);
        }
        else if (filePath.endsWith('.tar.bz2')) {
        return await this.extractTarBz2(filePath, destination);
        }
    
        throw new Error("Unknown file type " + filePath);
    }
  
    //#endregion
}