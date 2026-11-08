// adresse officielle : https://tickrate.eu (http et www y sont renvoyés ; rien en local)
if((location.protocol==='http:'||location.hostname==='www.tickrate.eu')&&!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)){location.replace('https://tickrate.eu'+location.pathname+location.search+location.hash);}
