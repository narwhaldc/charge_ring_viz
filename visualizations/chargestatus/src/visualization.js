import { VisualizationAPI } from '@splunk/dashboard-studio-extension';
import './visualization.css';

/* ------------------------------------------------------------------ *
 * Charge Status Ring
 * A self-drawn ring whose fill = battery %, with a dock + cable that
 * appears when seated and animates while charging. Domain rule: the
 * ring only charges on its dock, so on_dock = charging OR in_charger
 * (this absorbs the API's in_charger lag during a charge onset).
 * Expected columns: level, charging, in_charger, [ring_color], [ring_design]
 * ------------------------------------------------------------------ */

const R = 54;
const CX = 90;
const CY = 86;
const CIRC = 2 * Math.PI * R;

// Ring-body tint by Oura finish (falls back to stealth black).
const FINISH = {
    stealth_black: '#2b2f38',
    black: '#2b2f38',
    matte_black: '#26292f',
    silver: '#aab1bb',
    brushed_silver: '#aab1bb',
    titanium: '#8f97a1',
    gold: '#b9975b',
    brushed_gold: '#b9975b',
    rose_gold: '#c99a8f',
};

const rootElement = document.getElementById('root') || document.body;
const container = document.createElement('div');
container.className = 'cs-container';
rootElement.appendChild(container);

const state = { data: null, loading: false, width: 0, height: 0 };

const asBool = (v) => v === true || v === 'true' || v === '1' || v === 1;
const levelColor = (l) => (l >= 40 ? '#4CAF50' : l >= 15 ? '#F4A422' : '#E8503A');

function rowFrom(data) {
    if (!data) return null;
    const fields = (data.fields || []).map((f) => (f.name ? f.name : f));
    const cols = data.columns || [];
    if (!cols.length || !cols[0] || !cols[0].length) return null;
    const g = (n) => {
        const i = fields.indexOf(n);
        return i >= 0 ? cols[i][0] : undefined;
    };
    return {
        level: parseFloat(g('level')),
        charging: asBool(g('charging')),
        in_charger: asBool(g('in_charger')),
        ring_color: g('ring_color'),
        sync_label: g('sync_label'),
        sync_color: g('sync_color'),
    };
}

function svgFor(r) {
    const lvl = isFinite(r.level) ? Math.max(0, Math.min(100, r.level)) : 0;
    const c = levelColor(lvl);
    const base = FINISH[String(r.ring_color || '').toLowerCase()] || '#2b2f38';
    const onDock = r.charging || r.in_charger; // charging implies docked
    const dash = ((lvl / 100) * CIRC).toFixed(1);
    const gap = CIRC.toFixed(1);

    const glow = r.charging
        ? `<circle class="cs-glow" cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${c}" stroke-width="12"/>`
        : '';
    const bolt = r.charging
        ? `<text class="cs-bolt" x="${CX}" y="50" text-anchor="middle" font-size="16" fill="#FFD54A">⚡</text>`
        : '';

    let dock = '';
    if (onDock) {
        dock += `<rect x="58" y="150" width="64" height="12" rx="6" fill="#3a3f4a"/>`;
        dock += `<rect x="58" y="150" width="64" height="3" rx="1.5" fill="rgba(255,255,255,.15)"/>`;
        dock += `<path id="cs-cable" d="M150,236 C150,205 118,182 90,164" fill="none" stroke="#454b57" stroke-width="3"/>`;
        dock += `<rect x="143" y="231" width="16" height="10" rx="3" fill="#5a616f"/>`;
    }

    let dots = '';
    if (r.charging) {
        for (let k = 0; k < 3; k++) {
            dots += `<circle r="3" fill="${c}"><animateMotion dur="1.1s" begin="${(k * 0.37).toFixed(
                2
            )}s" repeatCount="indefinite"><mpath href="#cs-cable"/></animateMotion></circle>`;
        }
    }

    // Last-sync readout, lower-left, tinted by staleness (optional column).
    // Clock glyph (not a refresh arrow) — a passive "as of X ago" timestamp,
    // no click-to-refresh implication. Kept well inside the viewBox (y≈208).
    const sc = r.sync_color || '#8a93a0';
    const sync = r.sync_label
        ? `<g fill="none" stroke="${sc}" stroke-width="1.3" stroke-linecap="round">
               <circle cx="13" cy="208" r="5"/>
               <line x1="13" y1="208" x2="13" y2="204.5"/>
               <line x1="13" y1="208" x2="15.3" y2="209"/>
           </g>
           <text x="23" y="212" font-size="11" font-weight="600" fill="${sc}">${String(
              r.sync_label
          )}</text>`
        : '';

    const aria = `Battery ${Math.round(lvl)} percent, ${
        r.charging ? 'charging on dock' : r.in_charger ? 'docked, full' : 'on battery'
    }${r.sync_label ? ', last sync ' + r.sync_label : ''}`;

    return `<svg viewBox="0 0 180 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${aria}">
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${base}" stroke-width="16"/>
        ${glow}
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${dash} ${gap}" transform="rotate(-90 ${CX} ${CY})"/>
        ${bolt}
        <text x="${CX}" y="94" text-anchor="middle" font-size="26" font-weight="700" fill="#ffffff">${Math.round(
            lvl
        )}%</text>
        ${dock}${dots}${sync}
    </svg>`;
}

function render() {
    if (state.loading) {
        container.innerHTML = '<div class="cs-msg">Loading…</div>';
        return;
    }
    const r = rowFrom(state.data);
    if (!r || !isFinite(r.level)) {
        container.innerHTML = '<div class="cs-msg">No battery data</div>';
        return;
    }
    container.innerHTML = svgFor(r);
}

VisualizationAPI.addDataSourcesListener(
    ({ dataSources, loading }) => {
        state.loading = loading;
        state.data = dataSources?.primary?.data || null;
        render();
    },
    { invokeImmediately: true }
);

VisualizationAPI.addDimensionsListener(
    ({ width, height }) => {
        state.width = width;
        state.height = height;
        render();
    },
    { invokeImmediately: true }
);
