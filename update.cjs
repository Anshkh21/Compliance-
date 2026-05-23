const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove NOVAPEAK_MOCK_DATA
code = code.replace(/\/\/ Re-usable mock data[\s\S]*?\/\/ Authentication Middleware helper/g, '// Authentication Middleware helper');

// 2. Add Rate Limit and remove fallback in /api/compliance/scan
code = code.replace(
  /if \(\!ai\) \{\s*\/\/ Fallback simulated response[\s\S]*?return res\.json\(fallback\);\s*\}/g,
  `const today = new Date().setHours(0, 0, 0, 0);
      const userScans = db.scans.listByUserId(userId);
      const scansToday = userScans.filter((s) => s.timestamp > today).length;
      if (scansToday >= 10) {
        return res.status(429).json({ error: 'Daily scan limit (10) reached to prevent credit overuse. Please try again tomorrow.' });
      }

      if (!ai) {
        return res.status(400).json({ error: 'Gemini API Key is missing. Please configure it in .env to run real-time scans.' });
      }`
);

// 3. Remove fallback in scan catch block
code = code.replace(
  /\} catch \(err\) \{\s*console\.error\(\"Gemini Scan Error:\", err\);[\s\S]*?\.\.\.fallback\s*\}\);\s*\}/g,
  `} catch (err) {
      console.error("Gemini Scan Error:", err);
      return res.status(500).json({ error: "An error occurred during the AI scan.", details: err.message });
    }`
);

// 4. Remove fallback in check-copy
code = code.replace(
  /if \(\!ai\) \{\s*return res\.json\(generateSimulatedCopyCheck\(text, channel\)\);\s*\}/g,
  `if (!ai) {
        return res.status(400).json({ error: 'Gemini API Key is missing. Please configure it in .env.' });
      }`
);

// 5. Remove fallback in check-copy catch block
code = code.replace(
  /\} catch \(err\) \{\s*console\.error\(\"Check Copy Error:\", err\);\s*return res\.json\(generateSimulatedCopyCheck\(req\.body\.text \|\| '', req\.body\.channel \|\| 'Meta'\)\);\s*\}/g,
  `} catch (err) {
      console.error("Check Copy Error:", err);
      return res.status(500).json({ error: "An error occurred during copy check.", details: err.message });
    }`
);

// 6. Remove the simulated helper functions at the end of the file
code = code.replace(/\/\/ Simulated data helpers to handle cases when API key is not yet set[\s\S]*?startServer\(\);/g, 'startServer();\n');

fs.writeFileSync('server.ts', code);
console.log('Update complete.');
