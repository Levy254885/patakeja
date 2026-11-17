# Regenerates the lucide-react stub from the icons imported in src/. Run: python3 typecheck/refresh-stubs.py
import re, glob
names = set()
for f in glob.glob('src/**/*.ts*', recursive=True):
    for m in re.finditer(r'import\s*\{([^}]*)\}\s*from\s*"lucide-react"', open(f).read()):
        for n in m.group(1).split(','):
            n = n.strip().split(' as ')[0].strip()
            if n: names.add(n)
s = open('typecheck/stubs.d.ts').read()
s = re.sub(r'declare module "lucide-react".*\n', 'declare module "lucide-react" { ' + ' '.join(f'export const {n}: any;' for n in sorted(names)) + ' }\n', s)
open('typecheck/stubs.d.ts', 'w').write(s)
