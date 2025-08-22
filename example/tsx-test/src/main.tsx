import App from './app';
import Link from './components/Link';
import Pagination from './components/Pagination';
import Table from './components/Table';

customElements.define(Pagination.tag, Pagination.component);
customElements.define(Table.tag, Table.component);
customElements.define('fr-link', Link);

customElements.define('fr-app', App);

let app: HTMLElement | null = null;

function load() {
    if (!app) {
        app = document.createElement('fr-app');
        // app.textContent = 'slotsss'
        document.querySelector('#app')?.appendChild(app);
    }
}

function unmount() {
    if (app) {
        app.remove();
        app = null;
    }
}

load();

const loadBtn: HTMLButtonElement = document.querySelector('#load')!;
loadBtn.onclick = load;

const unmountBtn: HTMLButtonElement = document.querySelector('#unmount')!;
unmountBtn.onclick = unmount;