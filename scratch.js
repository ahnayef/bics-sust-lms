const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/page.tsx',
  'app/dashboard/book-list/BookListClient.tsx',
  'app/dashboard/(moderator-only)/print-qr/PrintQrClient.tsx',
  'app/dashboard/(moderator-only)/books/BooksClient.tsx',
  'app/dashboard/(moderator-only)/moderators/ModeratorsClient.tsx',
  'app/dashboard/(moderator-only)/transactions/TransactionsClient.tsx',
  'app/dashboard/(moderator-only)/copies/CopiesClient.tsx',
  'app/dashboard/profile/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Regex to remove data-aos attributes
  content = content.replace(/\s*data-aos(?:-[a-z]+)?="[^"]*"/g, '');
  
  // We need to add 'animate-in fade-in slide-in-from-bottom-4 duration-300' 
  // Wait, if we just removed data-aos, we should have added the animation class to className.
  // Actually, replacing it in the className might be safer.
}
