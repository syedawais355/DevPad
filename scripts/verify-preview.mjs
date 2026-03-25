import { spawn } from 'node:child_process';

const repositoryName = 'DevPad';
const host = '127.0.0.1';
const port = 4173;
const origin = `http://${host}:${port}`;
const basePath = `/${repositoryName}/`;
const isWindows = process.platform === 'win32';
const previewCommand = isWindows ? process.env.ComSpec ?? 'cmd.exe' : 'npm';
const previewArgs = isWindows ? ['/d', '/s', '/c', 'npm run preview:ci'] : ['run', 'preview:ci'];
const previewTimeoutMs = 30000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchText(pathname) {
  const response = await fetch(`${origin}${pathname}`);
  assert(response.ok, `Expected ${pathname} to return 200, received ${response.status}.`);

  return {
    response,
    text: await response.text()
  };
}

function extractAssetPaths(html) {
  const assets = new Set();

  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const assetPath = match[1];

    if (assetPath.startsWith(basePath) && !assetPath.endsWith('/')) {
      assets.add(assetPath);
    }
  }

  return [...assets];
}

function assertRelativeAssetSafety(html, pathname) {
  const forbiddenPatterns = [
    {
      pattern: /(?:src|href)=["']\/assets\//,
      message: `${pathname} still contains root-relative /assets paths.`
    },
    {
      pattern: /(?:src|href)=["']\/src\//,
      message: `${pathname} still points to source files instead of built assets.`
    },
    {
      pattern: /url\(\s*\/(?!\/)/,
      message: `${pathname} contains absolute CSS asset URLs that would bypass the GitHub Pages base path.`
    }
  ];

  for (const { pattern, message } of forbiddenPatterns) {
    assert(!pattern.test(html), message);
  }
}

async function waitForPreview(url) {
  const deadline = Date.now() + previewTimeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }

      lastError = new Error(`Preview server returned ${response.status} for ${url}.`);
    } catch (error) {
      lastError = error;
    }

    await wait(500);
  }

  throw new Error(`Timed out waiting for the preview server at ${url}. ${lastError instanceof Error ? lastError.message : ''}`.trim());
}

async function stopPreview(previewProcess) {
  if (previewProcess.exitCode !== null) {
    return;
  }

  if (isWindows) {
    const killCommand = process.env.ComSpec ?? 'cmd.exe';
    const killArgs = ['/d', '/s', '/c', `taskkill /PID ${previewProcess.pid} /T /F >NUL 2>&1`];

    await new Promise((resolve) => {
      const killer = spawn(killCommand, killArgs, {
        stdio: 'ignore'
      });

      killer.on('exit', resolve);
      killer.on('error', resolve);
    });

    previewProcess.stdout.destroy();
    previewProcess.stderr.destroy();
    return;
  }

  previewProcess.kill('SIGTERM');

  const deadline = Date.now() + 5000;

  while (previewProcess.exitCode === null && Date.now() < deadline) {
    await wait(100);
  }

  if (previewProcess.exitCode === null) {
    previewProcess.kill('SIGKILL');
  }
}

const previewProcess = spawn(previewCommand, previewArgs, {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

previewProcess.stdout.on('data', (chunk) => {
  stdout += chunk.toString();
});

previewProcess.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

try {
  await waitForPreview(`${origin}${basePath}`);

  const pages = [
    { pathname: basePath, marker: 'id="app"' },
    { pathname: `${basePath}help/`, marker: 'id="help-app"' },
    { pathname: `${basePath}.nojekyll`, marker: '' },
    { pathname: `${basePath}robots.txt`, marker: 'User-agent' },
    { pathname: `${basePath}sitemap.xml`, marker: '<urlset' }
  ];

  for (const page of pages) {
    const { text } = await fetchText(page.pathname);

    if (page.marker) {
      assert(text.includes(page.marker), `${page.pathname} did not contain the expected marker ${page.marker}.`);
    }

    if (page.pathname.endsWith('/')) {
      assertRelativeAssetSafety(text, page.pathname);

      for (const assetPath of extractAssetPaths(text)) {
        const assetResponse = await fetch(`${origin}${assetPath}`);

        assert(assetResponse.ok, `Asset ${assetPath} failed to load with status ${assetResponse.status}.`);
        await assetResponse.arrayBuffer();
      }
    }
  }

  console.log(`Preview verification passed for ${origin}${basePath}`);
} catch (error) {
  const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
  const details = error instanceof Error ? error.message : String(error);

  throw new Error(output ? `${details}\n\nPreview output:\n${output}` : details, {
    cause: error
  });
} finally {
  await stopPreview(previewProcess);
}
