import fs from "fs";
import path from "path";

const TEST_TEMP_ROOT = path.resolve(__dirname, ".tmp");

const ensureDirectory = (directoryPath: string) => {
  if (fs.existsSync(directoryPath)) {
    return;
  }

  const parentDirectory = path.dirname(directoryPath);
  if (parentDirectory && parentDirectory !== directoryPath) {
    ensureDirectory(parentDirectory);
  }

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }
};

const removeDirectoryRecursive = (directoryPath: string) => {
  if (!fs.existsSync(directoryPath)) {
    return;
  }

  for (const entry of fs.readdirSync(directoryPath)) {
    const fullPath = path.join(directoryPath, entry);
    const stats = fs.lstatSync(fullPath);

    if (stats.isDirectory()) {
      removeDirectoryRecursive(fullPath);
      continue;
    }

    fs.unlinkSync(fullPath);
  }

  fs.rmdirSync(directoryPath);
};

export const createTestTempDirectory = (prefix: string) => {
  ensureDirectory(TEST_TEMP_ROOT);
  return fs.mkdtempSync(path.join(TEST_TEMP_ROOT, `${prefix}-`));
};

export const cleanupTestTempDirectory = (directoryPath: string) => {
  removeDirectoryRecursive(directoryPath);
};
