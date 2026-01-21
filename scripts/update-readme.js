const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the database schema script
console.log('Generating database schema...');
try {
  execSync('node scripts/db-schema.js', { stdio: 'inherit' });
  
  // Read the generated schema
  const schemaPath = path.resolve(__dirname, '../DATABASE_SCHEMA.md');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Read the current README
  const readmePath = path.resolve(__dirname, '../README.md');
  let readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  // Update or add the database schema section
  const schemaSection = '## Database Schema\n\n' + schemaContent;
  
  if (readmeContent.includes('## Database Schema')) {
    // Replace existing schema section
    readmeContent = readmeContent.replace(/## Database Schema[\s\S]*?(?=## |$)/, schemaSection);
  } else {
    // Add new schema section at the end
    readmeContent = readmeContent.trim() + '\n\n' + schemaSection;
  }
  
  // Write the updated README
  fs.writeFileSync(readmePath, readmeContent);
  console.log('✅ README.md updated with database schema');
  
} catch (error) {
  console.error('Error updating README:', error);
  process.exit(1);
}
