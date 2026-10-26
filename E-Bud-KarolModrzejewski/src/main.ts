import './style.css';

type Produkt = {
    id: number;
    ean: string;
    nazwa: string;
    kategoria: string;
    sektor: string;
    regal: string;
    polka: string;
    ilosc: number;
};

type Operacja = {
    id: number;
    produkt: string;
    rodzaj: string;
    ilosc: number;
    pracownik: string;
    data: string;
};

let produkty: Produkt[] = JSON.parse(localStorage.getItem('produkty') || '[]');
let historia: Operacja[] = JSON.parse(localStorage.getItem('historia') || '[]');

const app = document.querySelector<HTMLDivElement>('#app')!;

function zapisz(): void {
    localStorage.setItem('produkty', JSON.stringify(produkty));
    localStorage.setItem('historia', JSON.stringify(historia));
}

function escapeHTML(tekst: string): string {
    return tekst.replace(/[&<>"']/g, znak => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[znak] || znak);
}

function pokaz(): void {
    const szukaj = document.querySelector<HTMLInputElement>('#szukaj')?.value.toLowerCase() || '';
    const lista = produkty.filter(p =>
        p.nazwa.toLowerCase().includes(szukaj) ||
        p.ean.toLowerCase().includes(szukaj) ||
        p.kategoria.toLowerCase().includes(szukaj)
    );

    app.innerHTML = `
        <header>
            <div>
                <h1>Elektro-Bud</h1>
                <p>System magazynowy</p>
            </div>
            <span class="status">Magazyn</span>
        </header>

        <main>
            <section class="statystyki">
                <div class="karta">
                    <span>Produkty</span>
                    <strong>${produkty.length}</strong>
                </div>
                <div class="karta">
                    <span>Wszystkie sztuki</span>
                    <strong>${produkty.reduce((suma, p) => suma + p.ilosc, 0)}</strong>
                </div>
                <div class="karta">
                    <span>Niskie stany</span>
                    <strong>${produkty.filter(p => p.ilosc < 5).length}</strong>
                </div>
            </section>

            <section class="panel">
                <h2>Dodaj produkt</h2>
                <form id="formularz">
                    <input name="ean" placeholder="Kod EAN" required>
                    <input name="nazwa" placeholder="Nazwa produktu" required>
                    <input name="kategoria" placeholder="Kategoria" required>
                    <input name="sektor" placeholder="Sektor" required>
                    <input name="regal" placeholder="Regał" required>
                    <input name="polka" placeholder="Półka" required>
                    <input name="ilosc" type="number" min="0" step="1" placeholder="Ilość" required>
                    <button type="submit">Dodaj produkt</button>
                </form>
            </section>

            <section class="panel">
                <div class="naglowek">
                    <h2>Produkty w magazynie</h2>
                    <input id="szukaj" placeholder="Szukaj produktu..." value="${escapeHTML(szukaj)}">
                </div>

                <div class="tabela">
                    <table>
                        <thead>
                            <tr>
                                <th>EAN</th>
                                <th>Nazwa</th>
                                <th>Kategoria</th>
                                <th>Lokalizacja</th>
                                <th>Ilość</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lista.map(p => `
                                <tr>
                                    <td>${escapeHTML(p.ean)}</td>
                                    <td>${escapeHTML(p.nazwa)}</td>
                                    <td>${escapeHTML(p.kategoria)}</td>
                                    <td>${escapeHTML(p.sektor)} / ${escapeHTML(p.regal)} / ${escapeHTML(p.polka)}</td>
                                    <td class="${p.ilosc < 5 ? 'malo' : ''}">${p.ilosc}</td>
                                    <td>
                                        <div class="akcje">
                                            <button class="maly" data-akcja="przyjmij" data-id="${p.id}">+</button>
                                            <button class="maly" data-akcja="wydaj" data-id="${p.id}">−</button>
                                            <button class="maly edytuj" data-akcja="edytuj" data-id="${p.id}">Edytuj</button>
                                            <button class="maly usun" data-akcja="usun" data-id="${p.id}">Usuń</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="6">Brak produktów</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="panel">
                <div class="naglowek">
                    <h2>Historia operacji</h2>
                    <button id="eksport">Eksport CSV</button>
                </div>
                <div class="tabela">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produkt</th>
                                <th>Operacja</th>
                                <th>Ilość</th>
                                <th>Pracownik</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historia.slice().reverse().map(o => `
                                <tr>
                                    <td>${escapeHTML(o.data)}</td>
                                    <td>${escapeHTML(o.produkt)}</td>
                                    <td>${escapeHTML(o.rodzaj)}</td>
                                    <td>${o.ilosc}</td>
                                    <td>${escapeHTML(o.pracownik)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5">Brak operacji</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    `;

    document.querySelector<HTMLFormElement>('#formularz')!.addEventListener('submit', dodajProdukt);

    document.querySelector<HTMLInputElement>('#szukaj')!.addEventListener('input', () => {
        const pole = document.querySelector<HTMLInputElement>('#szukaj')!;
        const pozycja = pole.selectionStart;
        pokaz();
        const nowePole = document.querySelector<HTMLInputElement>('#szukaj')!;
        nowePole.focus();
        nowePole.setSelectionRange(pozycja, pozycja);
    });

    app.querySelectorAll<HTMLButtonElement>('[data-akcja]').forEach(przycisk => {
        przycisk.addEventListener('click', () => {
            const id = Number(przycisk.dataset.id);
            const akcja = przycisk.dataset.akcja;
            const produkt = produkty.find(p => p.id === id);

            if (!produkt) return;

            if (akcja === 'usun') {
                if (confirm(`Czy usunąć produkt ${produkt.nazwa}?`)) {
                    produkty = produkty.filter(p => p.id !== id);
                    zapisz();
                    pokaz();
                }
            }

            if (akcja === 'edytuj') {
                edytujProdukt(produkt);
            }

            if (akcja === 'przyjmij') {
                zmienStan(produkt, 'Przyjęcie');
            }

            if (akcja === 'wydaj') {
                zmienStan(produkt, 'Wydanie');
            }
        });
    });

    document.querySelector<HTMLButtonElement>('#eksport')!.addEventListener('click', eksportCSV);
}

function dodajProdukt(event: SubmitEvent): void {
    event.preventDefault();

    const formularz = event.currentTarget as HTMLFormElement;
    const dane = new FormData(formularz);
    const ean = String(dane.get('ean')).trim();
    const nazwa = String(dane.get('nazwa')).trim();
    const ilosc = Number(dane.get('ilosc'));

    if (!ean || !nazwa || !Number.isInteger(ilosc) || ilosc < 0) {
        alert('Wprowadź poprawne dane.');
        return;
    }

    if (produkty.some(p => p.ean === ean)) {
        alert('Produkt z takim kodem EAN już istnieje.');
        return;
    }

    produkty.push({
        id: Date.now(),
        ean,
        nazwa,
        kategoria: String(dane.get('kategoria')).trim(),
        sektor: String(dane.get('sektor')).trim(),
        regal: String(dane.get('regal')).trim(),
        polka: String(dane.get('polka')).trim(),
        ilosc
    });

    zapisz();
    pokaz();
}

function edytujProdukt(produkt: Produkt): void {
    const nazwa = prompt('Nazwa produktu:', produkt.nazwa);
    if (nazwa === null || !nazwa.trim()) return;

    const kategoria = prompt('Kategoria:', produkt.kategoria);
    if (kategoria === null || !kategoria.trim()) return;

    const sektor = prompt('Sektor:', produkt.sektor);
    if (sektor === null || !sektor.trim()) return;

    const regal = prompt('Regał:', produkt.regal);
    if (regal === null || !regal.trim()) return;

    const polka = prompt('Półka:', produkt.polka);
    if (polka === null || !polka.trim()) return;

    produkt.nazwa = nazwa.trim();
    produkt.kategoria = kategoria.trim();
    produkt.sektor = sektor.trim();
    produkt.regal = regal.trim();
    produkt.polka = polka.trim();

    zapisz();
    pokaz();
}

function zmienStan(produkt: Produkt, rodzaj: string): void {
    const tekst = prompt(`Ile sztuk? Aktualny stan: ${produkt.ilosc}`);

    if (tekst === null || tekst.trim() === '') return;

    const ilosc = Number(tekst);

    if (!Number.isInteger(ilosc) || ilosc <= 0) {
        alert('Podaj liczbę całkowitą większą od zera.');
        return;
    }

    if (rodzaj === 'Wydanie' && ilosc > produkt.ilosc) {
        alert('Brak wystarczającej ilości w magazynie.');
        return;
    }

    const pracownik = prompt('Imię pracownika:');

    if (pracownik === null || !pracownik.trim()) return;

    if (rodzaj === 'Przyjęcie') {
        produkt.ilosc += ilosc;
    } else {
        produkt.ilosc -= ilosc;
    }

    historia.push({
        id: Date.now(),
        produkt: produkt.nazwa,
        rodzaj,
        ilosc,
        pracownik: pracownik.trim(),
        data: new Date().toLocaleString('pl-PL')
    });

    zapisz();
    pokaz();
}

function eksportCSV(): void {
    const wiersze = [
        ['Data', 'Produkt', 'Operacja', 'Ilość', 'Pracownik'],
        ...historia.map(o => [o.data, o.produkt, o.rodzaj, String(o.ilosc), o.pracownik])
    ];

    const csv = '\uFEFF' + wiersze
        .map(w => w.map(pole => `"${pole.replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const plik = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const adres = URL.createObjectURL(plik);
    const link = document.createElement('a');

    link.href = adres;
    link.download = 'historia-magazynu.csv';
    link.click();

    URL.revokeObjectURL(adres);
}

pokaz();