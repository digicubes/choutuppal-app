const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      results.push(file);
    }
  });
  return results;
};

const files = walk('C:\\CHOUTUPPAL2.0');
files.forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.prisma') || file.endsWith('.sql') || file.endsWith('.txt') || file.endsWith('.md')) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('manacities.in')) {
      content = content.replace(/manacities\.in/g, 'choutuppal.in');
      changed = true;
    }
    if (content.includes('Mana Cities')) {
      content = content.replace(/Mana Cities/gi, 'Choutuppal');
      changed = true;
    }
    if (content.includes('9912353705')) {
      content = content.replace(/9912353705/g, '8790083706');
      changed = true;
    }
    if (content.includes('Mosin Md')) {
      content = content.replace(/Mosin Md/g, 'Citizen CSC');
      changed = true;
    }
    if (content.includes('Mosin')) {
      content = content.replace(/Mosin/g, 'Citizen CSC');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated', file);
    }
  }
});
