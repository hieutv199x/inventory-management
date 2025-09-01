import fs from 'fs';
import path from 'path';

function cleanupConflicts() {
  console.log('🧹 Cleaning up routing conflicts...\n');
  
  const projectRoot = process.cwd();
  const appDir = path.join(projectRoot, 'src', 'app');
  
  // Files to remove that might cause conflicts
  const conflictingFiles = [
    'src/app/favicon.ico/page.tsx',
    'src/app/favicon.ico/route.ts',
    'src/app/favicon/page.tsx',
    'src/app/favicon/route.ts',
    'src/app/api/favicon/route.ts',
    'src/app/products/page.tsx',
    'src/app/products/route.ts'
  ];
  
  for (const filePath of conflictingFiles) {
    const fullPath = path.join(projectRoot, filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed: ${filePath}`);
      } catch (error) {
        console.log(`❌ Failed to remove: ${filePath} - ${error}`);
      }
    } else {
      console.log(`✓ Not found: ${filePath}`);
    }
  }
  
  // Check for empty directories and remove them
  const emptyDirs = [
    'src/app/favicon.ico',
    'src/app/favicon',
    'src/app/api/favicon',
    'src/app/products'
  ];
  
  for (const dirPath of emptyDirs) {
    const fullPath = path.join(projectRoot, dirPath);
    
    if (fs.existsSync(fullPath)) {
      try {
        const files = fs.readdirSync(fullPath);
        if (files.length === 0) {
          fs.rmdirSync(fullPath);
          console.log(`✅ Removed empty directory: ${dirPath}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not remove directory: ${dirPath}`);
      }
    }
  }
  
  // Ensure favicon exists in public
  const publicFavicon = path.join(projectRoot, 'public', 'favicon.ico');
  if (!fs.existsSync(publicFavicon)) {
    console.log('⚠️  favicon.ico not found in public folder');
    console.log('   Please add a favicon.ico file to the public folder');
  } else {
    console.log('✅ favicon.ico exists in public folder');
  }
  
  console.log('\n🎉 Cleanup completed!');
  console.log('Please restart your development server: npm run dev');
}

cleanupConflicts();
