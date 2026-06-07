const fs = require('fs');
const file = 'src/components/NewProposalModal.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/parseFloat\(formData\.discount \|\| '0'\)/g, "currencyToNumber(formData.discount || '0')");
fs.writeFileSync(file, content);
