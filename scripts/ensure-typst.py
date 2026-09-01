import os
import sys
import io
import urllib.request
import tarfile
import lzma

bin_dir = os.path.join(os.getcwd(), "bin")
target_file = os.path.join(bin_dir, "typst")

if os.path.exists(target_file):
    try:
        os.chmod(target_file, 0o755)
        print("Typst binary already present at:", target_file)
        sys.exit(0)
    except Exception:
        pass

print("Downloading Typst standalone compiler binary...")
os.makedirs(bin_dir, exist_ok=True)
url = "https://github.com/typst/typst/releases/download/v0.13.0/typst-x86_64-unknown-linux-musl.tar.xz"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    xz_decomp = lzma.decompress(data)
    with tarfile.open(fileobj=io.BytesIO(xz_decomp)) as tar:
        for member in tar.getmembers():
            if member.name.endswith("/typst") or member.name == "typst":
                f = tar.extractfile(member)
                with open(target_file, "wb") as out:
                    out.write(f.read())
                os.chmod(target_file, 0o755)
                print("Successfully installed Typst binary at:", target_file)
                sys.exit(0)
except Exception as e:
    print("Warning: Failed to pre-download Typst:", e)
    sys.exit(0)
