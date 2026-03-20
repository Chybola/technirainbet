const KLUCZ_SALDA = "trb_balance";
const DOMYSLNE_SALDO = 1000;

function pobierzSaldo() {
  const v = localStorage.getItem(KLUCZ_SALDA);
  return v === null ? DOMYSLNE_SALDO : Number(v);
}

function ustawSaldo(wartosc) {
  const num = Math.max(0, Math.round(Number(wartosc) || 0));
  localStorage.setItem(KLUCZ_SALDA, String(num));
  aktualizujWidokiSalda();
}

function zmienSaldo(delta) {
  ustawSaldo(pobierzSaldo() + Number(delta || 0));
}

function aktualizujWidokiSalda() {
  document
    .querySelectorAll(".balance-amount")
    .forEach((el) => (el.textContent = String(pobierzSaldo())));
}

document.addEventListener("DOMContentLoaded", () => {
  aktualizujWidokiSalda();
  document.querySelectorAll(".btn-topup").forEach((b) => {
    b.addEventListener("click", () => {
      const amt = Number(b.dataset.amount || 0);
      if (amt > 0) zmienSaldo(amt);
    });
  });
  document.querySelectorAll(".btn-reset").forEach((b) => {
    b.addEventListener("click", () => ustawSaldo(DOMYSLNE_SALDO));
  });
  document.querySelectorAll(".game-card").forEach((card) => {
    if (card.tagName.toLowerCase() === "a") return;
    const link = card.dataset.link;
    if (!link) return;
    card.style.cursor = "pointer";
    card.addEventListener("click", () => (location.href = link));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") location.href = link;
    });
  });
});
window.trb = {
  getBalance: pobierzSaldo,
  setBalance: ustawSaldo,
  changeBalance: zmienSaldo,
  updateBalanceDisplays: aktualizujWidokiSalda,
  pobierzSaldo,
  ustawSaldo,
  zmienSaldo,
  aktualizujWidokiSalda,
};

document.addEventListener("DOMContentLoaded", () => {
  const plansza = document.getElementById("mines-board");
  if (!plansza) return;
  const ROZMIAR = 6;
  const MINY = 1;
  const MARZA = 0.05;
  let pola = [];
  let aktualnyZaklad = 0;
  let zakladPostawiony = false;
  let bezpieczneKlikniecia = 0;

  function zbudujPlansze() {
    plansza.innerHTML = "";
    for (let i = 0; i < ROZMIAR * ROZMIAR; i++) {
      const btn = document.createElement("button");
      btn.className = "mine-cell";
      btn.disabled = true;
      plansza.appendChild(btn);
    }
    pola = Array.from(plansza.querySelectorAll(".mine-cell"));
  }

  function zresetujPlansze() {
    pola.forEach((c) => {
      c.dataset.revealed = "false";
      c.disabled = true;
      c.classList.remove("revealed", "mine");
      c.innerHTML = "";
    });
    if (zakladPostawiony && aktualnyZaklad > 0) {
      if (window.trb && typeof window.trb.changeBalance === "function") {
        window.trb.changeBalance(aktualnyZaklad);
      }
    }
    aktualnyZaklad = 0;
    zakladPostawiony = false;
    bezpieczneKlikniecia = 0;
    aktualizujWyswietlanieSzans();
    aktualizujKontrolki();
    document.getElementById("mine-msg").textContent = "";
  }

  function odkryjMine(cell) {
    cell.dataset.revealed = "true";
    cell.classList.add("revealed", "mine");
    const img = document.createElement("img");
    img.src = "zdjęcia/mine.svg";
    img.alt = "mina";
    cell.innerHTML = "";
    cell.appendChild(img);
    cell.disabled = true;
  }

  function odkryjDiament(cell) {
    cell.dataset.revealed = "true";
    cell.classList.add("revealed");
    const img = document.createElement("img");
    img.src = "zdjęcia/diamond.svg";
    img.className = "diamond";
    img.alt = "diament";
    cell.innerHTML = "";
    cell.appendChild(img);
    cell.disabled = true;
  }

  function liczbaPol() {
    return pola.length;
  }

  function prawdopodobienstwoPrzejsciaK(k) {
    const total = liczbaPol();
    const safe = total - MINY;
    if (k <= 0) return 1;
    let prod = 1;
    for (let i = 0; i < k; i++) {
      const numer = safe - i;
      const denom = total - i;
      if (numer <= 0) return 0;
      prod *= numer / denom;
    }
    return prod;
  }
  function szansaNastepnego() {
    const total = liczbaPol();
    const remainingSafe = total - MINY - bezpieczneKlikniecia;
    const remainingTotal = total - bezpieczneKlikniecia;
    if (remainingTotal <= 0) return 0;
    return Math.max(0, remainingSafe / remainingTotal);
  }

  function mnoznikWyplatyDlaK(k) {
    const surv = prawdopodobienstwoPrzejsciaK(k);
    if (surv === 0) return 0;
    return (1 - MARZA) / surv;
  }

  function aktualizujWyswietlanieSzans() {
    const stake = Number(document.getElementById("bet-amount").value || 0);
    const multNow = mnoznikWyplatyDlaK(bezpieczneKlikniecia);
    const multNext = mnoznikWyplatyDlaK(bezpieczneKlikniecia + 1);
    const payoutNow =
      stake > 0 && multNow > 0 ? (stake * multNow).toFixed(2) + " zł" : "-";
    const payoutNext =
      stake > 0 && multNext > 0 ? (stake * multNext).toFixed(2) + " zł" : "-";
    const payoutNowEl = document.getElementById("payout-now");
    const payoutNextEl = document.getElementById("payout-next");
    if (payoutNowEl) payoutNowEl.textContent = payoutNow;
    if (payoutNextEl) payoutNextEl.textContent = payoutNext;
  }

  function aktualizujKontrolki() {
    const przyciskPostaw = document.getElementById("place-bet");
    const poleZakladu = document.getElementById("bet-amount");
    const przyciskAllIn = document.getElementById("all-in");
    const przyciskWyplac = document.getElementById("cash-out");
    if (zakladPostawiony) {
      if (przyciskPostaw) przyciskPostaw.disabled = true;
      if (poleZakladu) poleZakladu.disabled = true;
      if (przyciskAllIn) przyciskAllIn.disabled = true;
      if (przyciskWyplac) przyciskWyplac.disabled = false;
    } else {
      if (przyciskPostaw) przyciskPostaw.disabled = false;
      if (poleZakladu) poleZakladu.disabled = false;
      if (przyciskAllIn) przyciskAllIn.disabled = false;
      if (przyciskWyplac) przyciskWyplac.disabled = true;
    }
  }

  zbudujPlansze();

  const przyciskStart = document.getElementById("start-mines");
  const przyciskResetPlanszy = document.querySelector(".btn-clear-all");
  const przyciskPostaw = document.getElementById("place-bet");
  const poleZakladu = document.getElementById("bet-amount");
  const komunikatEl = document.getElementById("mine-msg");

  function dolaczObslugePol() {
    pola.forEach((c) => {
      c.addEventListener("click", () => {
        if (c.dataset.revealed === "true") return;
        if (!zakladPostawiony) {
          komunikatEl.textContent =
            "Musisz najpierw postawić zakład lub doładować konto.";
          return;
        }
        const pozostalePola = pola.filter(
          (cc) => cc.dataset.revealed !== "true",
        );
        const pozostalyRazem = pozostalePola.length;
        const pozostaleBezpieczne = Math.max(0, pozostalyRazem - MINY);
        const szansaBezpieczna =
          pozostalyRazem > 0 ? pozostaleBezpieczne / pozostalyRazem : 0;
        const roll = Math.random();
        if (roll <= szansaBezpieczna) {
          odkryjDiament(c);
          bezpieczneKlikniecia += 1;
          aktualizujWyswietlanieSzans();
          komunikatEl.textContent = `Odkryto bezpieczne pole (${bezpieczneKlikniecia}). Możesz kontynuować lub wypłacić.`;
          return;
        } else {
          odkryjMine(c);
          komunikatEl.textContent = `Przegrałeś: ${aktualnyZaklad.toFixed(2)} zł`;
          pokazPopup(`Przegrałeś: ${aktualnyZaklad.toFixed(2)} zł`);
          zakladPostawiony = false;
          aktualnyZaklad = 0;
          pola.forEach((cc) => (cc.disabled = true));
          aktualizujKontrolki();
          aktualizujWyswietlanieSzans();
          setTimeout(() => zresetujPlansze(), 2500);
          return;
        }
      });
    });
  }

  dolaczObslugePol();

  przyciskPostaw?.addEventListener("click", () => {
    const amt = Math.max(0, Number(poleZakladu.value || 0));
    if (!amt || amt <= 0) {
      komunikatEl.textContent = "Podaj poprawną kwotę zakładu.";
      return;
    }
    const bal =
      window.trb && window.trb.getBalance ? window.trb.getBalance() : 0;
    if (amt > bal) {
      komunikatEl.textContent = "Brak wystarczających środków.";
      return;
    }
    if (window.trb && typeof window.trb.changeBalance === "function")
      window.trb.changeBalance(-amt);
    aktualnyZaklad = amt;
    zakladPostawiony = true;
    bezpieczneKlikniecia = 0;
    pola.forEach((cc) => (cc.disabled = false));
    komunikatEl.textContent = `Zakład postawiony: ${amt.toFixed(2)} zł — odkrywaj bezpieczne pola lub wypłacić`;
    aktualizujKontrolki();
    aktualizujWyswietlanieSzans();
  });
  const przyciskWyplac = document.getElementById("cash-out");
  przyciskWyplac?.addEventListener("click", () => {
    if (!zakladPostawiony) {
      komunikatEl.textContent = "Brak aktywnego zakładu.";
      return;
    }
    if (bezpieczneKlikniecia <= 0) {
      komunikatEl.textContent =
        "Musisz odkryć przynajmniej jedno pole zanim wypłacisz.";
      return;
    }
    const mult = mnoznikWyplatyDlaK(bezpieczneKlikniecia);
    const wyplata = aktualnyZaklad * mult;
    if (
      wplataIsValid(wyplata) &&
      window.trb &&
      typeof window.trb.changeBalance === "function"
    ) {
      window.trb.changeBalance(wyplata);
    }
    const nieodkryte = pola.filter((cc) => cc.dataset.revealed !== "true");
    if (nieodkryte.length > 0) {
      const idx = Math.floor(Math.random() * nieodkryte.length);
      odkryjMine(nieodkryte[idx]);
    }
    pokazPopup(
      `Wypłaciłeś: ${wyplata.toFixed(2)} zł (po ${bezpieczneKlikniecia} bezpiecznych)`,
    );

    zakladPostawiony = false;
    aktualnyZaklad = 0;
    aktualizujKontrolki();
    aktualizujWyswietlanieSzans();
    pola.forEach((cc) => (cc.disabled = true));
    setTimeout(() => {
      zresetujPlansze();
    }, 2500);
  });
  const przyciskAllIn = document.getElementById("all-in");
  przyciskAllIn?.addEventListener("click", () => {
    const bal =
      window.trb && window.trb.getBalance ? window.trb.getBalance() : 0;
    if (!bal || bal <= 0) {
      komunikatEl.textContent = "Brak środków do ustawienia All-in.";
      return;
    }
    if (poleZakladu) poleZakladu.value = String(bal);
    komunikatEl.textContent = `All-in ustawiony: ${bal.toFixed(2)} zł — naciśnij Postaw aby rozpocząć.`;
    aktualizujWyswietlanieSzans();
  });

  function wplataIsValid(v) {
    return typeof v === "number" && !Number.isNaN(v) && isFinite(v) && v > 0;
  }

  poleZakladu?.addEventListener("input", () => aktualizujWyswietlanieSzans());
  przyciskStart?.addEventListener("click", () => zresetujPlansze());
  przyciskResetPlanszy?.addEventListener("click", () => zresetujPlansze());

  zresetujPlansze();
  aktualizujWyswietlanieSzans();
  aktualizujKontrolki();

  function pokazPopup(message, timeout = 2200) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0,0,0,0.45)";
    overlay.style.zIndex = "9999";
    const box = document.createElement("div");
    box.style.background = "white";
    box.style.color = "#04243b";
    box.style.padding = "1.1rem 1.4rem";
    box.style.borderRadius = "8px";
    box.style.fontWeight = "700";
    box.textContent = message;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.style.transition = "opacity 300ms";
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 300);
    }, timeout);
  }
});
