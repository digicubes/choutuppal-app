const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));
  const ruleCounts = {};
  
  data.forEach(file => {
    file.messages.forEach(msg => {
      const ruleId = msg.ruleId || 'unknown';
      ruleCounts[ruleId] = (ruleCounts[ruleId] || 0) + 1;
    });
  });

  console.log('ESLint Rule Violations Summary:');
  Object.entries(ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([rule, count]) => {
      console.log(`${rule}: ${count}`);
    });
} catch (e) {
  console.error('Error reading or parsing eslint-report.json', e);
}
