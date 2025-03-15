// Script to clean up any existing server processes
const { execSync } = require('child_process');
const os = require('os');

console.log('Cleaning up existing server processes...');

try {
  if (os.platform() === 'win32') {
    // Windows
    try {
      execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
    } catch (e) {
      console.log('No Node.js processes found to kill.');
    }
  } else {
    // Unix-like (MacOS, Linux)
    try {
      // Kill any processes running node app.js (our server)
      execSync('pkill -f "node app.js" || true', { stdio: 'inherit' });
      
      // Find and kill processes using port 3000
      const findPortCmd = 'lsof -i :3000 -t || true';
      const pids = execSync(findPortCmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
      
      if (pids.length > 0) {
        console.log(`Found ${pids.length} processes using port 3000`);
        pids.forEach(pid => {
          if (pid) {
            try {
              console.log(`Killing process ${pid}`);
              execSync(`kill -9 ${pid}`);
            } catch (err) {
              console.log(`Could not kill process ${pid}: ${err.message}`);
            }
          }
        });
      } else {
        console.log('No processes found using port 3000');
      }
    } catch (e) {
      console.log(`Error during cleanup: ${e.message}`);
    }
  }
  
  console.log('Cleanup completed!');
} catch (error) {
  console.error('Error running cleanup script:', error);
  process.exit(1);
}

console.log('You can now start the server with "npm run dev" or "npm start"'); 