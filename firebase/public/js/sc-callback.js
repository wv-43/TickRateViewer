(function(){
  const q=new URLSearchParams(location.search),msg={code:q.get('code'),state:q.get('state'),error:q.get('error'),at:Date.now()};
  history.replaceState(null,'',location.pathname);
  try{localStorage.setItem('tr_sc_cb',JSON.stringify(msg))}catch(e){}
  document.getElementById('m').textContent='Tu peux fermer cette fenêtre.';
  window.close();
})();
