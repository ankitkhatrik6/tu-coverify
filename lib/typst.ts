import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

let cachedTypstBin: string | null = null;
let downloadPromise: Promise<string> | null = null;

/**
 * Ensures the Typst binary is available, downloading it if missing.
 */
export async function getTypstBinary(): Promise<string> {
  if (cachedTypstBin && fs.existsSync(cachedTypstBin)) {
    return cachedTypstBin;
  }

  // 1. Check local project bin
  const localBin = path.join(process.cwd(), "bin", "typst");
  if (fs.existsSync(localBin)) {
    try {
      fs.chmodSync(localBin, 0o755);
    } catch {
      // ignore
    }
    cachedTypstBin = localBin;
    return localBin;
  }

  // 2. Check /tmp/bin/typst
  const tmpBin = path.join(os.tmpdir(), "bin", "typst");
  if (fs.existsSync(tmpBin)) {
    try {
      fs.chmodSync(tmpBin, 0o755);
    } catch {
      // ignore
    }
    cachedTypstBin = tmpBin;
    return tmpBin;
  }

  // 3. Check system PATH
  try {
    const { stdout } = await execAsync("which typst");
    const sysPath = stdout.trim();
    if (sysPath && fs.existsSync(sysPath)) {
      cachedTypstBin = sysPath;
      return sysPath;
    }
  } catch {
    // Not in PATH
  }

  // 4. Download on-demand if missing
  if (!downloadPromise) {
    downloadPromise = (async () => {
      console.log("[Typst] Binary not found. Auto-downloading static Typst release...");
      const targetDir = fs.existsSync(path.join(process.cwd(), "bin"))
        ? path.join(process.cwd(), "bin")
        : path.join(os.tmpdir(), "bin");
      fs.mkdirSync(targetDir, { recursive: true });
      const targetFile = path.join(targetDir, "typst");

      const pyScript = `
import urllib.request, tarfile, lzma, io, os, sys

url = "https://github.com/typst/typst/releases/download/v0.13.0/typst-x86_64-unknown-linux-musl.tar.xz"
target = sys.argv[1]
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as resp:
    data = resp.read()

xz_decomp = lzma.decompress(data)
with tarfile.open(fileobj=io.BytesIO(xz_decomp)) as tar:
    for member in tar.getmembers():
        if member.name.endswith("/typst") or member.name == "typst":
            f = tar.extractfile(member)
            with open(target, "wb") as out:
                out.write(f.read())
            os.chmod(target, 0o755)
            break
`;

      await execAsync(`python3 -c '${pyScript}' "${targetFile}"`);
      if (fs.existsSync(targetFile)) {
        fs.chmodSync(targetFile, 0o755);
        cachedTypstBin = targetFile;
        console.log("[Typst] Successfully initialized Typst binary at:", targetFile);
        return targetFile;
      }
      throw new Error("Failed to auto-download Typst binary.");
    })();
  }

  return downloadPromise;
}
