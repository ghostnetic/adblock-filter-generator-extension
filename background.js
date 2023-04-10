function parseHostsFile(content) {
  const lines = content.split('\n');
  const adblockRules = [];

  lines.forEach(line => {
    line = line.trim();

    if (line.startsWith('#') || line.startsWith('!') || line === '') {
      return;
    }

    if (line.startsWith('||') && line.endsWith('^')) {
      adblockRules.push(line);
    } else {
      const parts = line.split(/\s+/);
      const domain = parts[parts.length - 1];
      const rule = `||${domain}^`;
      adblockRules.push(rule);
    }
  });

  return adblockRules;
}

function generateFilter(fileContents) {
  const adblockRulesSet = new Set();

  fileContents.forEach(content => {
    const adblockRules = parseHostsFile(content);
    adblockRules.forEach(rule => adblockRulesSet.add(rule));
  });

  const sortedRules = Array.from(adblockRulesSet).sort();
  const header = generateHeader(sortedRules.length);
  const filterContent = [header, ...sortedRules].join('\n');
  return filterContent;
}

function generateHeader(domainCount) {
  const date = new Date().toISOString().slice(0, 10);
  return `# Title: AdBlock Filter Generator
# Description: Chrome Extension to generate adblock syntax filter from multiple host files and blocklists
# Created: ${date}
# Domain Count: ${domainCount}
#===============================================================`;
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'generateFilter') {
    try {
      console.log('Received file contents:', request.fileContents);
      const filterContent = generateFilter(request.fileContents);
      console.log('Generated filter content:', filterContent);

      const blob = new Blob([filterContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'blocklist.txt';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      sendResponse({ success: true });
    } catch (err) {
      console.error('Error generating filter:', err);
      sendResponse({ error: 'Error generating filter. Check the files and try again.' });
    }
  }

  // Required for async response handling.
  return true;
});

