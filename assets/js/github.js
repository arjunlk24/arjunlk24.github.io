const TOKEN_KEY = 'portfolio_gh_token';

const GH = {
  getToken() { return localStorage.getItem(TOKEN_KEY) || ''; },
  setToken(t) { localStorage.setItem(TOKEN_KEY, t.trim()); },
  clearToken() { localStorage.removeItem(TOKEN_KEY); },
  hasToken() { return !!this.getToken(); },

  async _request(path, opts = {}) {
    const res = await fetch(`https://api.github.com/repos/${SITE_CONFIG.owner}/${SITE_CONFIG.repo}${path}`, {
      ...opts,
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Accept': 'application/vnd.github+json',
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.status === 204 ? null : res.json();
  },

  async verify() {
    return this._request('');
  },

  async getFile(path) {
    try {
      const data = await this._request(`/contents/${path}?ref=${SITE_CONFIG.branch}`);
      const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
      return { content, sha: data.sha };
    } catch (e) {
      if (String(e.message).includes('404')) return null;
      throw e;
    }
  },

  async putFile(path, textContent, message) {
    const existing = await this.getFile(path);
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(textContent))),
      branch: SITE_CONFIG.branch,
    };
    if (existing) body.sha = existing.sha;
    return this._request(`/contents/${path}`, { method: 'PUT', body: JSON.stringify(body) });
  },

  async putImage(path, dataUrl, message) {
    const base64 = dataUrl.split(',')[1];
    const existing = await this.getFile(path).catch(() => null);
    const body = { message, content: base64, branch: SITE_CONFIG.branch };
    if (existing) body.sha = existing.sha;
    return this._request(`/contents/${path}`, { method: 'PUT', body: JSON.stringify(body) });
  },
};
