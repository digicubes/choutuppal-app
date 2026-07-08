const fs = require('fs');
let code = fs.readFileSync('src/components/admin-view.tsx', 'utf8');

// The hooks block to move
const hooksBlock = \
  const [branding, setBranding] = useState<any>({})
  const [isSavingBranding, setIsSavingBranding] = useState(false)

  useEffect(() => {
    if (activeTab === 'branding') {
      fetch('/api/admin/branding')
        .then(res => res.json())
        .then(data => setBranding(data))
    }
  }, [activeTab])
\;

// 1. Remove it from its original location
const regexToRemove = /[\s]*const \[branding, setBranding\] = useState<any>\(\{\}\)[\s]*const \[isSavingBranding, setIsSavingBranding\] = useState\(false\)[\s]*useEffect\(\(\) => \{[\s]*if \(activeTab === 'branding'\) \{[\s]*fetch\('\/api\/admin\/branding'\)[\s]*\.then\(res => res\.json\(\)\)[\s]*\.then\(data => setBranding\(data\)\)[\s]*\}[\s]*\}, \[activeTab\]\)/;

if (regexToRemove.test(code)) {
    code = code.replace(regexToRemove, '');
    
    // 2. Insert it at the top
    code = code.replace('const [isAddingUser, setIsAddingUser] = useState(false)', 'const [isAddingUser, setIsAddingUser] = useState(false)' + hooksBlock);
    
    fs.writeFileSync('src/components/admin-view.tsx', code);
    console.log('Successfully moved hooks to the top');
} else {
    console.log('Regex failed to match');
}
