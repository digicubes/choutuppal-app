const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Match ANY relation that doesn't have onDelete: Cascade and add it.
// This ensures that when a parent is deleted, all children are safely cascaded.
const regex = /(?:User|Story|Short|Post|Listing|RealEstateListing|VideoPlaylist|LongVideo|Blog|News|BannerAd)\??\s+@relation\(([^)]*references:\s*\[id\][^)]*)\)/g;

content = content.replace(regex, (match) => {
  if (match.includes('onDelete')) {
    return match;
  }
  return match.slice(0, -1) + ', onDelete: Cascade)';
});

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Fixed schema cascades for ALL relations');
