const Menu = require("./menu");
const { opener } = require("../addons/opener");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

if (!window.location.href.startsWith("https://kirka.io")) {
  Object.defineProperty(navigator, "userAgent", {
    get: () =>
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  window.require = undefined;
  document.querySelector("#juice-menu").remove();
}

document.addEventListener("DOMContentLoaded", async () => {
  const scriptsPath = ipcRenderer.sendSync("get-scripts-path");
  const scripts = fs.readdirSync(scriptsPath);
  scripts.forEach((script) => {
    if (!script.endsWith(".js")) return;

    const scriptPath = path.join(scriptsPath, script);
    require(scriptPath);
  });

  const menu = new Menu();
  menu.init();

  opener();

  const formatLink = (link) => {
    return link.replace(/\\/g, "/");
  };

  const lobbyNews = async () => {
    if (
      !document.querySelector("#app > .interface") ||
      document.querySelector(".lobby-news")
    )
      return;

    const news = await fetch("https://juice-api.irrvlo.xyz/api/news").then(
      (res) => res.json()
    );

    if (!news.length) return;

    const lobbyNewsContainer = document.createElement("div");
    lobbyNewsContainer.id = "lobby-news";
    lobbyNewsContainer.className = "lobby-news";
    lobbyNewsContainer.style = `
      width: 250px;
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      transform-origin: top left;
      top: 180px;
      left: 147px;
    `;

    document.querySelector("#app > .interface").appendChild(lobbyNewsContainer);

    const createNewsCard = (newsItem) => {
      const div = document.createElement("div");
      div.className = "news-card";
      div.style = `
        width: 100%;
        border: 4px solid #3e4d7c;
        border-bottom: solid 4px var(--wNmWnwMW-6);
        border-top: 4px solid #4d5c8b;
        background-color: var(--wNmWnwMW-5);
        display: flex;
        ${newsItem.link ? "cursor: pointer;" : ""}
        ${newsItem.imgType === "banner" ? "flex-direction: column;" : ""}
      `;

      lobbyNewsContainer.appendChild(div);

      const addImage = () => {
        const img = document.createElement("img");
        img.src = newsItem.img;
        img.style = `
          width: ${newsItem.imgType === "banner" ? "100%" : "4rem"};
          max-height: ${newsItem.imgType === "banner" ? "7.5rem" : "4rem"};
          object-fit: cover;
          object-position: center;
        `;
        div.appendChild(img);
      };

      const addContent = () => {
        const content = document.createElement("div");
        content.style = `
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: left;
        `;

        const title = document.createElement("span");
        title.innerText = newsItem.title;
        title.style = `
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
          color: var(--WwmMNWnw-1);
        `;
        content.appendChild(title);

        const text = document.createElement("span");
        text.innerText = newsItem.content;
        text.style = `
          font-size: 0.9rem;
          color: #fff;
          margin: 0;
        `;
        if (newsItem.content) content.appendChild(text);

        div.appendChild(content);
      };

      if (newsItem.img && newsItem.img !== "") addImage();
      addContent();

      if (newsItem.link) {
        div.onclick = () => {
          if (newsItem.link.startsWith("https://kirka.io")) {
            window.location.href = newsItem.link;
          } else {
            window.open(newsItem.link, "_blank");
          }
        };
      }
    };

    news.forEach((newsItem) => createNewsCard(newsItem));
  };

  const juiceDiscordButton = () => {
    const btn = document.querySelectorAll(".card-cont.soc-group")[1];
    if (!btn || document.querySelector("#juice-discord-btn")) return;

    const discordBtn = btn.cloneNode(true);
    discordBtn.className =
      "card-cont soc-group transfer-list-top-enter transfer-list-top-enter-active";
    discordBtn.id = "juice-discord-btn";
    discordBtn.style = `
    background: linear-gradient(to top, rgba(255,147,45,.75), rgba(172,250,112,.75)) !important;
    border-bottom-color: #c47022 !important;
    border-top-color: #c5ff99 !important;
    border-right-color: #e48329 !important;`;
    const textDivs = discordBtn.querySelector(".text-soc").children;
    textDivs[0].innerText = "JUICE";
    textDivs[1].innerText = "DISCORD";

    const i = document.createElement("i");
    i.className = "fab fa-discord";
    i.style.fontSize = "48px";
    i.style.fontFamily = "Font Awesome 6 Brands";
    i.style.margin = "3.2px 1.6px 0 1.6px";
    i.style.textShadow = "0 0 0 transparent";
    discordBtn.querySelector("svg").replaceWith(i);

    discordBtn.onclick = () => {
      window.open("https://discord.gg/FjzAAdSjng", "_blank");
    };

    btn.replaceWith(discordBtn);

    setInterval(() => {
      discordBtn.className = "card-cont soc-group";
    }, 300);
  };

  const loadTheme = () => {
    const addedStyles = document.createElement("style");
    addedStyles.id = "juice-styles-theme";
    document.head.appendChild(addedStyles);

    const updateTheme = () => {
      const settings = ipcRenderer.sendSync("get-settings");
      const cssLink = settings.css_link;

      if (cssLink && settings.css_enabled) {
        addedStyles.innerHTML = `@import url('${formatLink(cssLink)}');`;
      } else {
        addedStyles.innerHTML = "";
      }
    };

    document.addEventListener("juice-settings-changed", (e) => {
      if (
        e.detail.setting === "css_link" ||
        e.detail.setting === "css_enabled"
      ) {
        updateTheme();
      }
    });

    updateTheme();
  };

  const applyUIFeatures = () => {
    const addedStyles = document.createElement("style");
    addedStyles.id = "juice-styles-ui-features";
    document.head.appendChild(addedStyles);

    const updateUIFeatures = () => {
      const settings = ipcRenderer.sendSync("get-settings");
      const styles = [];

      if (settings.perm_crosshair) {
        styles.push(
          ".crosshair-static { opacity: 1 !important; visibility: visible !important; display: block !important; }"
        );
      }

      if (settings.hide_chat) {
        styles.push(
          ".desktop-game-interface > .chat { display: none !important; }"
        );
      }

      if (settings.hide_interface) {
        styles.push(
          ".desktop-game-interface, .crosshair-cont, .ach-cont, .hitme-cont, .sniper-mwNMW-cont, .team-score, .score { display: none !important; }"
        );
      }

      if (settings.skip_loading) {
        styles.push(".loading-scene { display: none !important; }");
      }

      if (settings.interface_opacity) {
        styles.push(
          `.desktop-game-interface { opacity: ${settings.interface_opacity}% !important; }`
        );
      }

      if (settings.interface_bounds) {
        let scale =
          settings.interface_bounds === "1"
            ? 0.9
            : settings.interface_bounds === "0"
            ? 0.8
            : 1;
        styles.push(
          `.desktop-game-interface { transform: scale(${scale}) !important; }`
        );
      }

      if (settings.hitmarker_link !== "") {
        styles.push(
          `.hitmark { content: url(${formatLink(
            settings.hitmarker_link
          )}) !important; }`
        );
      }

      if (settings.killicon_link !== "") {
        styles.push(
          `.animate-cont::before { content: ""; background: url(${formatLink(
            settings.killicon_link
          )}); width: 10rem; height: 10rem; margin-bottom: 2rem; display: inline-block; background-position: center; background-size: contain; background-repeat: no-repeat; }
          .animate-cont svg { display: none; }`
        );
      }

      if (!settings.ui_animations) {
        styles.push(
          "* { transition: none !important; animation: none !important; }"
        );
      }

      if (settings.rave_mode) {
        styles.push(
          "canvas { animation: rotateHue 1s linear infinite !important; }"
        );
      }

      addedStyles.innerHTML = styles.join("");
    };

    document.addEventListener("juice-settings-changed", (e) => {
      const relevantSettings = [
        "perm_crosshair",
        "hide_chat",
        "hide_interface",
        "skip_loading",
        "interface_opacity",
        "interface_bounds",
        "hitmarker_link",
        "ui_animations",
        "rave_mode",
      ];

      if (relevantSettings.includes(e.detail.setting)) {
        updateUIFeatures();
      }
    });

    updateUIFeatures();
  };

  const handleLobby = () => {
    lobbyNews();
    juiceDiscordButton();
  };

  const handleServers = async () => {
    const mapImages = await fetch(
      "https://raw.githubusercontent.com/SheriffCarry/KirkaSkins/main/maps/full_mapimages.json"
    ).then((res) => res.json());

    const replaceMapImages = () => {
      const servers = document.querySelectorAll(".server");
      servers.forEach((server) => {
        let mapName = server.querySelector(".map").innerText.split("_").pop();
        if (mapImages[mapName]) {
          server.style.backgroundImage = `url(${mapImages[mapName]})`;
          server.style.backgroundSize = "cover";
          server.style.backgroundPosition = "center";
        } else {
          server.style.backgroundImage = "none";
        }
      });
    };
    replaceMapImages();

    let interval = setInterval(() => {
      if (!window.location.href.startsWith("https://kirka.io/servers")) {
        clearInterval(interval);
      }
      replaceMapImages();
    }, 250);

    document.addEventListener("click", (e) => {
      if (e.shiftKey && e.target.classList.contains("author-name")) {
        setTimeout(() => {
          navigator.clipboard.readText().then((text) => {
            window.location.href = `https://kirka.io/profile/${text.replace(
              "#",
              ""
            )}`;
            const username = e.target.innerText.replace(":", "");
            customNotification({
              message: `Loading ${username}${text}'s profile...`,
            });
          });
        }, 250);
      }
    });
  };

  const customNotification = (data) => {
    const notifElement = document.createElement("div");
    notifElement.classList.add("vue-notification-wrapper");
    notifElement.style =
      "transition-timing-function: ease; transition-delay: 0s; transition-property: all;";
    notifElement.innerHTML = `
    <div
      style="
        display: flex;
        align-items: center;
        padding: .9rem 1.1rem;
        margin-bottom: .5rem;
        color: var(--white);
        cursor: pointer;
        box-shadow: 0 0 0.7rem rgba(0,0,0,.25);
        border-radius: .2rem;
        background: linear-gradient(262.54deg,#202639 9.46%,#223163 100.16%);
        margin-left: 1rem;
        border: solid .15rem var(--wwNnMWmW-1);
        font-family: Exo\ 2;" class="alert-default"
    > ${
      data.icon
        ? `
        <img
          src="${data.icon}"
          style="
            min-width: 2rem;
            height: 2rem;
            margin-right: .9rem;"
        />`
        : ""
    }
      <span style="font-size: 1rem; font-weight: 600; text-align: left;" class="text">${
        data.message
      }</span>
    </div>`;

    document
      .getElementsByClassName("vue-notification-group")[0]
      .children[0].appendChild(notifElement);

    setTimeout(() => {
      try {
        notifElement.remove();
      } catch {}
    }, 5000);
  };

  ipcRenderer.on("notification", (e, data) => {
    customNotification(data);
  });

  ipcRenderer.on("url-change", (e, url) => {
    if (url === "https://kirka.io/") {
      handleLobby();
    }
    if (url.startsWith("https://kirka.io/servers/")) {
      handleServers();
    }
  });

  const handleInitialLoad = () => {
    const url = window.location.href;
    if (url.startsWith("https://kirka.io/") && !url.includes("games")) {
      handleLobby();
    }

    if (url.startsWith("https://kirka.io/servers/")) {
      handleServers();
    }
    loadTheme();
    applyUIFeatures();
  };

  handleInitialLoad();
});