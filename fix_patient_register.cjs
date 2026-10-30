const fs = require('fs');
let content = fs.readFileSync('src/auth/PatientRegisterPage.tsx', 'utf8');

content = content.replace(
  'const { addToast } = useEmr();',
  'const { addToast, facility } = useEmr();'
);

content = content.replace(
  'const [error, setError] = useState<string | null>(null);',
  'const [error, setError] = useState<string | null>(null);\n  const [isBlurred, setIsBlurred] = useState(false);'
);

content = content.replace(
  'useEffect(() => {\n    const timer = setTimeout(() => undefined, 0); // suppress lint noop-effect\n    return () => clearTimeout(timer);\n  }, []);',
  'useEffect(() => {\n    const timer = setTimeout(() => setIsBlurred(true), 2500);\n    return () => clearTimeout(timer);\n  }, []);'
);

content = content.replace(
  'const facilityCode = resolveFacilityCode();',
  'const facilityCode = facility?.code.startsWith(" UATH\) ? \UATH\ : \CAREVIA\;'
);

const idx = content.indexOf('/** Resolve the facility code');
if (idx >= 0) {
 const endIdx = content.indexOf('}', idx) + 1;
 content = content.slice(0, idx) + content.slice(endIdx);
}

content = content.replace(
 'onClick={() => undefined}',
 'onClick={() => setIsBlurred((prev) => !prev)}'
);

content = content.replace(
 'Blur Background',
 '{isBlurred ? <Eye className=\w-3.5 h-3.5 text-emerald-400\ /> : <EyeOff className=\w-3.5 h-3.5 text-slate-300\ />}\n <span>{isBlurred ? \View Original Photo\ : \Blur Background\}</span>'
);

fs.writeFileSync('src/auth/PatientRegisterPage.tsx', content);
console.log('Done');
