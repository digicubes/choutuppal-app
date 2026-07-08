const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const listingRegex = /(model Listing \{[\s\S]*?)(\n\})/;
code = code.replace(listingRegex, "$1\n  whatsappClicks Int      @default(0)\n  callClicks     Int      @default(0)\n  shareClicks    Int      @default(0)\n  catalogItems   String?  // JSON string for products/menu items$2");

code += `

// ─── App Branding ───────────────────────────────────────────
model AppBranding {
  id              String   @id @default(cuid())
  appName         String   @default("Super App")
  tagline         String?
  logoUrl         String?
  primaryColorHex String   @default("#4169E1")
  whatsappNumber  String?
  email           String?
  address         String?
  socialLinks     String?  // JSON string
  seoOgImage      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
`;

fs.writeFileSync('prisma/schema.prisma', code);
console.log('Schema updated successfully');
