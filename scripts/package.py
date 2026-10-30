from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'extension/manifest.json').read_text())
out = root / 'dist'
out.mkdir(exist_ok=True)
with ZipFile(out / 'vacaturekompas.zip', 'w', ZIP_DEFLATED) as archive:
    for file in sorted((root / 'extension').iterdir()):
        if file.is_file():
            archive.write(file, file.name)
print('Gemaakt: dist/vacaturekompas.zip (versie ' + manifest['version'] + ')')
