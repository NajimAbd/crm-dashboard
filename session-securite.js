// Securite Nexa (24.09.2026) : chaque appel au serveur n8n emporte le jeton de session
// donne par le serveur a la connexion. Si le serveur refuse (401), on renvoie vers la connexion.
(function () {
  var HOTE = 'n8n.srv936251.hstgr.cloud/webhook/';
  var dejaAverti = false;
  function jeton() {
    try { var s = JSON.parse(localStorage.getItem('crm_session_user') || 'null'); return (s && s.token) || ''; } catch (e) { return ''; }
  }
  function avecJeton(url) {
    var u = String(url || '');
    if (u.indexOf(HOTE) < 0 || u.indexOf('/webhook/crm-admin-') >= 0) return u;
    var j = jeton();
    if (!j || /[?&]jeton=/.test(u)) return u;
    var i = u.indexOf('#');
    var ancre = i >= 0 ? u.slice(i) : '';
    if (i >= 0) u = u.slice(0, i);
    return u + (u.indexOf('?') < 0 ? '?' : '&') + 'jeton=' + encodeURIComponent(j) + ancre;
  }
  function sessionExpiree() {
    if (dejaAverti) return;
    dejaAverti = true;
    alert('Ta session a expiré. Pour ta sécurité, reconnecte-toi.');
    localStorage.removeItem('crm_session_user');
    localStorage.removeItem('crm_session_expiry');
    var racine = location.pathname.indexOf('/laboratoire/') >= 0 ? '../' : '';
    location.href = racine + 'index.html';
  }
  if (window.fetch) {
    var fetchOrigine = window.fetch.bind(window);
    window.fetch = function (url, opts) {
      var estRequete = (typeof Request !== 'undefined') && (url instanceof Request);
      var brut = estRequete ? url.url : url;
      var cible = avecJeton(brut);
      if (cible === String(brut || '')) return fetchOrigine(url, opts);
      var p = estRequete ? fetchOrigine(new Request(cible, url), opts) : fetchOrigine(cible, opts);
      return p.then(function (r) { if (r.status === 401) sessionExpiree(); return r; });
    };
  }
  if (window.XMLHttpRequest) {
    var ouvrir = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (methode, url) {
      var cible = avecJeton(url);
      if (cible !== String(url || '')) {
        this.addEventListener('load', function () { if (this.status === 401) sessionExpiree(); });
      }
      var args = Array.prototype.slice.call(arguments);
      args[1] = cible;
      return ouvrir.apply(this, args);
    };
  }
})();
