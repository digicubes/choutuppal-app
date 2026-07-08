const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Match relation definitions for User, User?, Story, Story?
const regex = /(?:User|Story)\??\s+@relation\(([^)]*references:\s*\[id\][^)]*)\)/g;

content = content.replace(regex, (match) => {
  if (match.includes('onDelete')) {
    return match;
  }
  return match.slice(0, -1) + ', onDelete: Cascade)';
});

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Fixed schema cascades for User and Story');
