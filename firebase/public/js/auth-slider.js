/* =====================================================
 * TICKRATE - Slider de Présentation Vertical Descendant (auth-slider.js)
 * Présentation fluide & animée : 128 Tick, Vigie, Ranked ELO, Skins & Lobbies
 * Navigation descendante par scroll, swipe ou boutons avec environnement vivant
 * ===================================================== */

(function(){
  'use strict';

  const AUTH_SLIDES = [
    {
      "id": "ranked_128",
      "map": "maps/mirage.jpg?v=2.50",
      "step": {
        "fr": "128 TICK",
        "en": "128 TICK",
        "ru": "128 ТИК"
      },
      "fr": {
        "title": "DU 5V5 CS:GO SUR DE BONS SERVEURS.",
        "desc": "Des serveurs dédiés en 128 tick, hébergés en Europe. Tu lances la recherche, seul ou avec ton groupe, et le match démarre avec les règles compétitives de CS:GO.",
        "stats": [
          {
            "val": "128 tick",
            "lbl": "sur chaque serveur de match"
          },
          {
            "val": "MR15",
            "lbl": "avec prolongations, comme en compétitif"
          }
        ]
      },
      "en": {
        "title": "5V5 CS:GO ON PROPER SERVERS.",
        "desc": "Dedicated 128-tick servers hosted in Europe. Queue alone or with your party and the match starts with CS:GO competitive rules.",
        "stats": [
          {
            "val": "128 tick",
            "lbl": "on every match server"
          },
          {
            "val": "MR15",
            "lbl": "with overtime, like competitive"
          }
        ]
      },
      "ru": {
        "title": "5V5 CS:GO НА НОРМАЛЬНЫХ СЕРВЕРАХ.",
        "desc": "Выделенные серверы 128 тик в Европе. Ищи матч один или с группой, игра идёт по соревновательным правилам CS:GO.",
        "stats": [
          {
            "val": "128 тик",
            "lbl": "на каждом сервере"
          },
          {
            "val": "MR15",
            "lbl": "с овертаймами, как в соревновательном"
          }
        ]
      }
    },
    {
      "id": "vigie_fairplay",
      "map": "maps/inferno.jpg?v=2.50",
      "step": {
        "fr": "ANTI-TRICHE",
        "en": "ANTI-CHEAT",
        "ru": "АНТИЧИТ"
      },
      "fr": {
        "title": "LES TRICHEURS SONT REPÉRÉS PAR LE SERVEUR.",
        "desc": "Rien à installer sur ton PC. Le serveur analyse chaque match, les joueurs signalés passent devant des joueurs expérimentés (Vigie), et ton Trust Factor suit ton comportement.",
        "stats": [
          {
            "val": "0 logiciel",
            "lbl": "à installer sur ton PC"
          },
          {
            "val": "Vigie",
            "lbl": "des joueurs revoient les cas suspects"
          }
        ]
      },
      "en": {
        "title": "CHEATERS ARE CAUGHT SERVER-SIDE.",
        "desc": "Nothing to install on your PC. The server analyses every match, reported players are reviewed by experienced players (Vigie), and your Trust Factor follows your behaviour.",
        "stats": [
          {
            "val": "No software",
            "lbl": "to install on your PC"
          },
          {
            "val": "Vigie",
            "lbl": "players review suspicious cases"
          }
        ]
      },
      "ru": {
        "title": "ЧИТЕРОВ ЛОВИТ СЕРВЕР.",
        "desc": "Ничего не нужно ставить на ПК. Сервер анализирует каждый матч, жалобы разбирают опытные игроки (Vigie), а фактор доверия отражает твоё поведение.",
        "stats": [
          {
            "val": "Без софта",
            "lbl": "на твоём ПК"
          },
          {
            "val": "Vigie",
            "lbl": "игроки разбирают подозрительные случаи"
          }
        ]
      }
    },
    {
      "id": "elo_stats",
      "map": "maps/dust2.jpg?v=2.50",
      "step": {
        "fr": "ELO",
        "en": "ELO",
        "ru": "ELO"
      },
      "fr": {
        "title": "UN ELO QUI REGARDE COMMENT TU JOUES.",
        "desc": "Gagner reste ce qui compte le plus, mais ta performance du match (rating, ADR, éliminations) fait varier les points. 10 niveaux, un classement séparé pour le Wingman, et un ladder chaque semaine.",
        "stats": [
          {
            "val": "10 niveaux",
            "lbl": "et les rangs CS:GO"
          },
          {
            "val": "5v5 + Wingman",
            "lbl": "deux classements séparés"
          }
        ]
      },
      "en": {
        "title": "AN ELO THAT LOOKS AT HOW YOU PLAY.",
        "desc": "Winning still matters most, but your match performance (rating, ADR, kills) changes the points. 10 levels, a separate Wingman ranking, and a weekly ladder.",
        "stats": [
          {
            "val": "10 levels",
            "lbl": "plus CS:GO ranks"
          },
          {
            "val": "5v5 + Wingman",
            "lbl": "two separate rankings"
          }
        ]
      },
      "ru": {
        "title": "ELO, КОТОРЫЙ СМОТРИТ НА ТВОЮ ИГРУ.",
        "desc": "Победа важнее всего, но твоя игра в матче (рейтинг, ADR, убийства) меняет количество очков. 10 уровней, отдельный рейтинг для Напарников и еженедельный ладдер.",
        "stats": [
          {
            "val": "10 уровней",
            "lbl": "и звания CS:GO"
          },
          {
            "val": "5v5 + Напарники",
            "lbl": "два отдельных рейтинга"
          }
        ]
      }
    },
    {
      "id": "skins_steam",
      "map": "maps/anubis.jpg?v=2.50",
      "step": {
        "fr": "SKINS",
        "en": "SKINS",
        "ru": "СКИНЫ"
      },
      "fr": {
        "title": "TES SKINS SUR NOS SERVEURS.",
        "desc": "Les skins de ton inventaire Steam et ceux gagnés sur TICKRATE (caisses, drops de fin de match) s'affichent en jeu. Connexion par Steam : ton mot de passe Steam ne passe jamais par nous.",
        "stats": [
          {
            "val": "Steam",
            "lbl": "connexion officielle (OpenID)"
          },
          {
            "val": "Drops",
            "lbl": "en fin de match"
          }
        ]
      },
      "en": {
        "title": "YOUR SKINS ON OUR SERVERS.",
        "desc": "Skins from your Steam inventory and the ones you earn on TICKRATE (cases, end-of-match drops) show up in game. Steam sign-in: your Steam password never goes through us.",
        "stats": [
          {
            "val": "Steam",
            "lbl": "official sign-in (OpenID)"
          },
          {
            "val": "Drops",
            "lbl": "at the end of matches"
          }
        ]
      },
      "ru": {
        "title": "ТВОИ СКИНЫ НА НАШИХ СЕРВЕРАХ.",
        "desc": "Скины из инвентаря Steam и полученные на TICKRATE (кейсы, дропы после матча) видны в игре. Вход через Steam: твой пароль Steam к нам не попадает.",
        "stats": [
          {
            "val": "Steam",
            "lbl": "официальный вход (OpenID)"
          },
          {
            "val": "Дропы",
            "lbl": "после матча"
          }
        ]
      }
    },
    {
      "id": "lobbies_squads",
      "map": "maps/nuke.jpg?v=2.50",
      "step": {
        "fr": "ÉQUIPES",
        "en": "TEAMS",
        "ru": "КОМАНДЫ"
      },
      "fr": {
        "title": "JOUE ENTRE AMIS OU EN ÉQUIPE.",
        "desc": "Invite tes amis dans ton groupe avec un lien, crée ton équipe et défie les autres en ligue, ou inscris-toi aux tournois organisés par les joueurs.",
        "stats": [
          {
            "val": "Groupe",
            "lbl": "jusqu'à 5 avec un lien"
          },
          {
            "val": "Ligue",
            "lbl": "5 divisions, de l'Open à la Pro"
          }
        ]
      },
      "en": {
        "title": "PLAY WITH FRIENDS OR AS A TEAM.",
        "desc": "Invite friends to your party with a link, create your team and challenge others in the league, or join tournaments hosted by players.",
        "stats": [
          {
            "val": "Party",
            "lbl": "up to 5 with a link"
          },
          {
            "val": "League",
            "lbl": "5 divisions, from Open to Pro"
          }
        ]
      },
      "ru": {
        "title": "ИГРАЙ С ДРУЗЬЯМИ ИЛИ КОМАНДОЙ.",
        "desc": "Зови друзей в группу по ссылке, создай команду и вызывай другие в лиге, или участвуй в турнирах от игроков.",
        "stats": [
          {
            "val": "Группа",
            "lbl": "до 5 по ссылке"
          },
          {
            "val": "Лига",
            "lbl": "5 дивизионов, от Open до Pro"
          }
        ]
      }
    }
  ];

  const SCROLL_PROMPT_I18N = {
    fr: 'SCROLL VERS LE BAS',
    en: 'SCROLL DOWN',
    ru: 'ЛИСТАЙТЕ ВНИЗ'
  };

  let currentIndex = 0;
  let activeBgLayer = 'A';
  let autoTimer = null;
  let isPaused = false;
  let touchStartY = 0;
  let lastWheelTime = 0;
  let isTransitioning = false;
  const SLIDE_DURATION = 7500; // 7.5s par slide en auto-play

  function getCurrentLang(){
    if (typeof lang !== 'undefined' && (lang === 'en' || lang === 'ru' || lang === 'fr')) {
      return lang;
    }
    return 'fr';
  }

  function getSlideData(idx){
    const s = AUTH_SLIDES[idx % AUTH_SLIDES.length];
    const l = getCurrentLang();
    const localized = s[l] || s.fr || s.en;
    return {
      id: s.id,
      map: s.map,
      title: localized.title,
      desc: localized.desc,
      stats: localized.stats
    };
  }

  function crossfadeBg(mapUrl){
    const layerA = document.getElementById('authBgLayerA');
    const layerB = document.getElementById('authBgLayerB');
    if (!layerA || !layerB) return;

    if (activeBgLayer === 'A') {
      layerB.style.backgroundImage = `url('${mapUrl}')`;
      layerB.classList.add('active');
      layerA.classList.remove('active');
      activeBgLayer = 'B';
    } else {
      layerA.style.backgroundImage = `url('${mapUrl}')`;
      layerA.classList.add('active');
      layerB.classList.remove('active');
      activeBgLayer = 'A';
    }
  }

  function renderVRail(){
    const rail = document.getElementById('authVRail');
    if (!rail) return;

    const l = getCurrentLang();
    rail.innerHTML = `
      <div class="auth-vrail-track">
        <div class="auth-vrail-thumb" id="authVRailThumb"></div>
      </div>
      <div class="auth-vrail-steps">
        ${AUTH_SLIDES.map((s, idx) => {
          const stepLbl = s.step[l] || s.step.fr;
          const numStr = String(idx + 1).padStart(2, '0');
          const isActive = idx === currentIndex;
          return `
            <button type="button" class="auth-vstep-btn ${isActive ? 'active' : ''}" data-vstep="${idx}" title="${stepLbl}">
              <span class="vstep-num">${numStr}</span>
              <span class="vstep-line"></span>
              <span class="vstep-label">${stepLbl}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    updateVRailState();
  }

  function updateVRailState(){
    const rail = document.getElementById('authVRail');
    if (!rail) return;

    const btns = rail.querySelectorAll('.auth-vstep-btn');
    btns.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === currentIndex);
    });

    const thumb = document.getElementById('authVRailThumb');
    if (thumb && btns.length) {
      // barre de progression : part du 01 et s'arrête pile sur la page en cours (ne dépasse jamais la dernière)
      const pct = (currentIndex / (AUTH_SLIDES.length - 1)) * 100;
      thumb.style.height = `${pct}%`;
    }

    const curNum = document.getElementById('authCurNum');
    if (curNum) {
      curNum.textContent = String(currentIndex + 1).padStart(2, '0');
    }
  }

  function updateScrollPromptText(){
    const btn = document.getElementById('authScrollDown');
    if (!btn) return;
    const txtEl = btn.querySelector('.scroll-prompt-txt');
    if (txtEl) {
      const l = getCurrentLang();
      txtEl.textContent = SCROLL_PROMPT_I18N[l] || SCROLL_PROMPT_I18N.fr;
    }
  }

  function renderSlide(index, direction = 'down'){
    const viewport = document.getElementById('authSliderViewport');
    if (!viewport) return;

    const prevIndex = currentIndex;
    currentIndex = (index + AUTH_SLIDES.length) % AUTH_SLIDES.length;
    const data = getSlideData(currentIndex);

    // Cross-fade fluide de la map en arrière-plan
    crossfadeBg(data.map);

    // Animation descendante ou ascendante
    const animClass = direction === 'up' ? 'slide-ascending' : 'slide-descending';

    viewport.innerHTML = `
      <div class="auth-slide ${animClass}" id="authSlideCurrent" data-slide-id="${data.id}">
        <h1 class="auth-slide-title">${data.title}</h1>
        <p class="auth-slide-desc">${data.desc}</p>
        <div class="auth-slide-stats">
          ${data.stats.map(st => `
            <div class="auth-stat-card">
              <div class="stat-val">${st.val}</div>
              <div class="stat-lbl">${st.lbl}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    updateVRailState();
    restartTimer();
  }

  function nextSlide(){
    renderSlide(currentIndex + 1, 'down');
  }

  function prevSlide(){
    renderSlide(currentIndex - 1, 'up');
  }

  function restartTimer(){
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      if (!isPaused) {
        nextSlide();
      }
    }, SLIDE_DURATION);
  }

  function handleWheel(e){
    const now = Date.now();
    if (now - lastWheelTime < 450) return; // Throttling fluide pour éviter les sauts multiples
    if (Math.abs(e.deltaY) < 18) return; // Ignore les petits bruits de touchpad

    if (e.deltaY > 0) {
      lastWheelTime = now;
      nextSlide();
    } else if (e.deltaY < 0) {
      lastWheelTime = now;
      prevSlide();
    }
  }

  function initSlider(){
    const authArt = document.getElementById('authArt');
    const authEl = document.getElementById('auth');
    if (!authArt) return;

    // Initialisation première couche de map
    const layerA = document.getElementById('authBgLayerA');
    if (layerA) {
      layerA.style.backgroundImage = `url('${AUTH_SLIDES[0].map}')`;
      layerA.classList.add('active');
      activeBgLayer = 'A';
    }

    renderVRail();
    updateScrollPromptText();
    renderSlide(0, 'down');

    // Clic sur le bouton de scroll descendant
    const scrollDownBtn = document.getElementById('authScrollDown');
    if (scrollDownBtn) {
      scrollDownBtn.onclick = (e) => {
        e.preventDefault();
        nextSlide();
      };
    }

    // Clic sur les étapes du rail vertical
    const rail = document.getElementById('authVRail');
    if (rail) {
      rail.onclick = (e) => {
        const btn = e.target.closest('[data-vstep]');
        if (btn) {
          const targetIdx = +btn.dataset.vstep;
          if (targetIdx !== currentIndex) {
            const dir = targetIdx > currentIndex ? 'down' : 'up';
            renderSlide(targetIdx, dir);
          }
        }
      };
    }

    // Détection du scroll souris (Wheel) descendant / ascendant
    authArt.addEventListener('wheel', handleWheel, { passive: true });

    // Pause au survol de la souris pour confort de lecture
    authArt.addEventListener('mouseenter', () => { isPaused = true; });
    authArt.addEventListener('mouseleave', () => { isPaused = false; });

    // Support tactile (swipe vertical)
    authArt.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    authArt.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchEndY - touchStartY;
        if (diff > 45) {
          prevSlide(); // glissé vers le bas -> slide précédent
        } else if (diff < -45) {
          nextSlide(); // glissé vers le haut -> slide suivant descendant
        }
      }
    }, { passive: true });

    // Navigation au clavier quand la page auth est active
    document.addEventListener('keydown', (e) => {
      if (!authEl || authEl.hidden) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      }
    });
  }

  // Hook appelé lorsque la langue du site change
  window.updateAuthSliderLang = function(){
    renderVRail();
    updateScrollPromptText();
    renderSlide(currentIndex, 'down');
  };

  // Démarrage automatique
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlider);
  } else {
    setTimeout(initSlider, 0);
  }

})();
