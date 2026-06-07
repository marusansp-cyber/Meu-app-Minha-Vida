const fs = require('fs');
const file = 'src/components/NewProposalModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/parseFloat\(formData\.downPayment\)/g, "currencyToNumber(formData.downPayment || '0')");
content = content.replace(/parseFloat\(formData\.downPayment \|\| '0'\)/g, "currencyToNumber(formData.downPayment || '0')");
content = content.replace(/e\.target\.value\.replace\(\/\\D\/g, ''\)/g, "maskCurrency(e.target.value)");
content = content.replace(/currencyToNumber\(e\.target\.value\)/g, "maskCurrency(e.target.value)");

fs.writeFileSync(file, content);
