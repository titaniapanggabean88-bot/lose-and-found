"use strict";

/* ============ Util & Storage ============ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
};

const KEY_LAP = "bh_laporan";
const KEY_DEN = "bh_denda";
const KEY_SET = "bh_pengaturan";

const DEF_PUNISH = [
  "Push up 20x",
  "Push up 50x",
  "Lari keliling lapangan",
  "Membersihkan kelas",
  "Menulis surat pernyataan",
  "Denda 2x lipat harga barang",
  "Peraturan dilarang bicara 1 hari",
  "Cuci peralatan di kantin",
];

const CATEGORIES = ["Alat Tulis", "Elektronik", "Pakaian", "Alat Makan", "Kesehatan", "Olahraga", "Uang", "Aksesoris", "Lainnya"];
const PALETTE = ["#4f46e5", "#f59e0b", "#059669", "#dc2626", "#0ea5e9", "#8b5cf6", "#14b8a6", "#f43f5e", "#64748b"];
const STATUS_TEXT = { hilang: "Masih Hilang", ditemukan: "Ditemukan", diserahkan: "Diserahkan" };

let laporan = store.get(KEY_LAP, []);
let denda = store.get(KEY_DEN, []);
let pengaturan = store.get(KEY_SET, { punishment: DEF_PUNISH });
if (!Array.isArray(pengaturan.punishment) || pengaturan.punishment.length === 0) pengaturan.punishment = DEF_PUNISH;

const save = () => { store.set(KEY_LAP, laporan); store.set(KEY_DEN, denda); store.set(KEY_SET, pengaturan); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().slice(0, 10);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = String(d).split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}
function bulanKey(tgl) {
  const [y, m] = String(tgl).split("-");
  return y && m ? y + "-" + m : tgl;
}
function bulanLabel(key) {
  const [y, m] = key.split("-");
  const nama = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return nama[Number(m) - 1] + " " + y;
}

function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ============ Tabs ============ */
$$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab-btn").forEach((b) => b.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $("#tab-" + btn.dataset.tab).classList.add("active");
  });
});

/* ============ Modal Barang ============ */
const modal = $("#modal-overlay");
function openModal(record) {
  const r = record || {};
  $("#modal-title").textContent = r.id ? "Edit Catatan" : "Catat Barang Hilang";
  $("#record-id").value = r.id || "";
  $("#f-owner").value = r.owner || "";
  $("#f-nama").value = r.nama || "";
  $("#f-kategori").value = r.kategori || "Lainnya";
  $("#f-tanggal").value = r.tanggal || today();
  $("#f-lokasi").value = r.lokasi || "";
  $("#f-harga").value = r.harga ?? "";
  $("#f-hukuman").value = r.hukuman || "";
  $("#f-deskripsi").value = r.deskripsi || "";
  $("#f-catatan").value = r.catatan || "";
  modal.classList.remove("hidden");
  setTimeout(() => $("#f-owner").focus(), 50);
}
function closeModal() { modal.classList.add("hidden"); }

$("#btn-catat-cepat").addEventListener("click", () => openModal());
$("#btn-batal").addEventListener("click", closeModal);
$("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

$("#form-barang").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = $("#record-id").value;
  const data = {
    owner: $("#f-owner").value.trim(),
    nama: $("#f-nama").value.trim(),
    kategori: $("#f-kategori").value,
    tanggal: $("#f-tanggal").value,
    lokasi: $("#f-lokasi").value.trim(),
    harga: Number($("#f-harga").value) || 0,
    hukuman: $("#f-hukuman").value,
    hukumanSelesai: false,
    deskripsi: $("#f-deskripsi").value.trim(),
    catatan: $("#f-catatan").value.trim(),
  };
  if (id) {
    const i = laporan.findIndex((x) => x.id === id);
    laporan[i] = { ...laporan[i], ...data };
    toast("Catatan diperbarui ✓");
  } else {
    laporan.unshift({ ...data, id: uid(), status: "hilang", tanggalStatus: today() });
    toast("Barang hilang dicatat ✓");
  }
  save(); renderAll(); closeModal();
});

/* ============ CRUD helpers ============ */
function tandaiDitemukan(id) {
  const r = laporan.find((x) => x.id === id);
  if (!r) return;
  r.status = "ditemukan"; r.tanggalStatus = today();
  save(); renderAll(); toast(`"${r.nama}" ditemukan, tersimpan di Lost & Found ✓`);
}
function serahkan(id) {
  const r = laporan.find((x) => x.id === id);
  if (!r) return;
  r.status = "diserahkan"; r.tanggalStatus = today();
  save(); renderAll(); toast(`"${r.nama}" sudah diserahkan ke ${r.owner} ✓`);
}
function hapusLaporan(id) {
  const r = laporan.find((x) => x.id === id);
  if (!confirm(`Hapus catatan "${r ? r.nama : ""}" milik ${r ? r.owner : ""}? Denda terkait ikut terhapus.`)) return;
  laporan = laporan.filter((x) => x.id !== id);
  denda = denda.filter((d) => d.laporanId !== id);
  save(); renderAll(); toast("Catatan dihapus");
}

function pemilikTerbanyak(limit = 10) {
  const map = {};
  laporan.forEach((r) => { const k = r.owner || "Tanpa nama"; map[k] = (map[k] || 0) + 1; });
  const arr = Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  if (arr.length > limit) {
    const top = arr.slice(0, limit);
    const lain = arr.slice(limit).reduce((s, x) => s + x.value, 0);
    top.push({ label: "Lainnya", value: lain });
    return top;
  }
  return arr;
}

function barChart(elId, emptyId, entries) {
  const el = $("#" + elId);
  const max = Math.max(...entries.map((e) => e.value), 1);
  el.innerHTML = entries.map((e) => `
    <div class="bar-row">
      <div class="bar-label" title="${esc(e.label)}">${esc(e.label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(3, (e.value / max) * 100)}%"></div></div>
      <div class="bar-value">${e.value}</div>
    </div>`).join("");
  $("#" + emptyId).style.display = entries.length ? "none" : "block";
}

function pieChart(elId, emptyId, legendId, entries) {
  const total = entries.reduce((s, e) => s + e.value, 0);
  const el = $("#" + elId);
  if (!total) { el.style.background = ""; $("#" + legendId).innerHTML = ""; $("#" + emptyId).style.display = "block"; return; }
  $("#" + emptyId).style.display = "none";
  let acc = 0;
  const stops = entries.map((e, i) => {
    const pct = (e.value / total) * 100;
    const s = `${PALETTE[i % PALETTE.length]} ${acc}% ${acc + pct}%`;
    acc += pct;
    e._color = PALETTE[i % PALETTE.length];
    return s;
  }).join(", ");
  el.style.background = `conic-gradient(${stops})`;
  el.innerHTML = `<div class="pie-center">${total}<br>barang</div>`;
  $("#" + legendId).innerHTML = entries.map((e) => `
    <li><span class="swatch" style="background:${e._color}"></span> ${esc(e.label)}
      <b>${e.value} (${Math.round((e.value / total) * 100)}%)</b></li>`).join("");
}

/* ============ Render: Dashboard ============ */
function renderDashboard() {
  const total = laporan.length;
  const hilang = laporan.filter((r) => r.status === "hilang").length;
  const ketemu = laporan.filter((r) => r.status === "ditemukan" || r.status === "diserahkan").length;
  const totalDenda = denda.reduce((s, d) => s + Number(d.jumlah || 0), 0);
  $("#stat-total").textContent = total;
  $("#stat-hilang").textContent = hilang;
  $("#stat-ditemukan").textContent = ketemu;
  $("#stat-denda").textContent = rp(totalDenda);

  barChart("chart-owner", "chart-owner-empty", pemilikTerbanyak());
  const byKat = CATEGORIES.map((k) => ({ label: k, value: laporan.filter((r) => r.kategori === k).length }))
    .filter((e) => e.value > 0);
  pieChart("chart-kat", "chart-kat-empty", "chart-kat-legend", byKat);

  const recent = laporan.slice(0, 6);
  $("#recent-list").innerHTML = recent.length ? `
    <table>
      <tbody>${recent.map((r) => `
        <tr>
          <td>${fmtDate(r.tanggal)}</td>
          <td><b>${esc(r.owner)}</b></td>
          <td>${esc(r.nama)}</td>
          <td><span class="badge ${r.status}">${STATUS_TEXT[r.status]}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>` : `<p class="empty-note">Belum ada laporan. Klik "+ Catat Barang Hilang" untuk mulai.</p>`;
}

/* ============ Render: Barang ============ */
function renderBarang() {
  const q = ($("#cari-barang").value || "").toLowerCase();
  const fStatus = $("#filter-status").value;
  const rows = laporan.filter((r) => {
    const text = (r.owner + " " + r.nama + " " + r.lokasi + " " + r.deskripsi + " " + r.catatan).toLowerCase();
    return (!q || text.includes(q)) && (!fStatus || r.status === fStatus);
  });
  $("#tabel-barang").innerHTML = rows.map((r) => `
    <tr>
      <td>${fmtDate(r.tanggal)}</td>
      <td><b>${esc(r.owner)}</b></td>
      <td>${esc(r.nama)}<br><span style="color:var(--muted);font-size:12px">${esc(r.deskripsi)}</span></td>
      <td>${esc(r.kategori)}</td>
      <td>${esc(r.lokasi) || "—"}</td>
      <td><span class="badge ${r.status}">${STATUS_TEXT[r.status]}</span></td>
      <td style="font-size:12.5px">${esc(r.hukuman) || "—"}
        ${r.hukuman && r.hukumanSelesai ? '<br><span class="badge done">Selesai</span>' : ""}</td>
      <td class="act">
        ${r.status !== "ditemukan" && r.status !== "diserahkan" ? `<button class="btn btn-sm ok" onclick="tandaiDitemukan('${r.id}')">Ditemukan!</button>` : ""}
        ${r.status === "ditemukan" ? `<button class="btn btn-sm primary" onclick="serahkan('${r.id}')">Serahkan</button>` : ""}
        <button class="btn btn-sm primary" onclick='editLaporan("${r.id}")'>Edit</button>
        <button class="btn btn-sm danger" onclick="hapusLaporan('${r.id}')">Hapus</button>
      </td>
    </tr>`).join("");
  $("#barang-empty").style.display = rows.length ? "none" : "block";
}

function editLaporan(id) { openModal(laporan.find((x) => x.id === id)); }

/* ============ Render: Lost & Found ============ */
function renderFound() {
  const q = ($("#cari-found").value || "").toLowerCase();
  const match = (r) => (r.owner + " " + r.nama + " " + r.lokasi + " " + r.deskripsi).toLowerCase().includes(q);

  function renderGrid(elId, emptyId, list, actions) {
    const items = list.filter(match);
    $("#" + elId).innerHTML = items.map((r) => `
      <div class="found-card">
        <div class="fc-title">${esc(r.nama)}</div>
        <div class="fc-sub">Pemilik: <b>${esc(r.owner)}</b></div>
        <div class="fc-meta">📅 Hilang: ${fmtDate(r.tanggal)} &nbsp;·&nbsp; 📍 ${esc(r.lokasi) || "—"}</div>
        <div class="fc-meta">🏷 ${esc(r.kategori)}</div>
        ${r.deskripsi ? `<div class="fc-desc">${esc(r.deskripsi)}</div>` : ""}
        <div class="fc-meta" style="margin-bottom:8px">${actions(r)}</div>
      </div>`).join("");
    $("#" + emptyId).style.display = items.length ? "none" : "block";
    return items;
  }

  renderGrid("found-hilang", "found-hilang-empty", laporan.filter((r) => r.status === "hilang"),
    (r) => `<button class="btn btn-sm ok" onclick="tandaiDitemukan('${r.id}')">✅ Tandai Ditemukan</button>`);

  renderGrid("found-tersedia", "found-tersedia-empty", laporan.filter((r) => r.status === "ditemukan"),
    (r) => `<button class="btn btn-sm primary" onclick="serahkan('${r.id}')">📤 Serahkan ke Pemilik</button>`);

  renderGrid("found-serah", "found-serah-empty", laporan.filter((r) => r.status === "diserahkan"),
    (r) => `<span class="badge diserahkan">Sudah diambil ✓</span>`);
}

/* ============ Render: Denda & Hukuman ============ */
function renderSelectLaporan() {
  const s = $("#denda-laporan");
  const tersisa = laporan.filter((r) => r.status !== "diserahkan");
  s.innerHTML = tersisa.length
    ? `<option value="">Pilih barang... (belum diserahkan)</option>` + tersisa.map((r) =>
        `<option value="${r.id}" data-harga="${r.harga || 0}">${esc(r.owner)} — ${esc(r.nama)} (${r.status})</option>`).join("")
    : `<option value="">Semua barang sudah diserahkan ✨</option>`;
}

$("#form-denda").addEventListener("submit", (e) => {
  e.preventDefault();
  const idLap = $("#denda-laporan").value;
  const jumlah = Number($("#denda-jumlah").value);
  const isi = $("#denda-catatan").value.trim();
  if (!idLap || !jumlah) { toast("Pilih barang dan isi jumlah denda!"); return; }
  const r = laporan.find((x) => x.id === idLap);
  denda.unshift({
    id: uid(), laporanId: idLap, owner: r.owner, nama: r.nama,
    jumlah, tanggal: $("#denda-tanggal").value || today(), catatan: isi,
  });
  save(); renderAll(); toast("Denda dicatat ✓");
  $("#form-denda").reset(); renderSelectLaporan();
});

$("#denda-laporan").addEventListener("change", (e) => {
  const opt = e.target.selectedOptions[0];
  if (opt && opt.dataset.harga && !$("#denda-jumlah").value) {
    $("#denda-jumlah").value = opt.dataset.harga;
  }
});

function renderDenda() {
  $("#tabel-denda").innerHTML = denda.length ? denda.map((d, i) => `
    <tr>
      <td>${fmtDate(d.tanggal)}</td>
      <td><b>${esc(d.owner)}</b></td>
      <td>${esc(d.nama)}</td>
      <td><b>${rp(d.jumlah)}</b></td>
      <td>${esc(d.catatan) || "—"}</td>
      <td><button class="btn btn-sm danger" onclick="hapusDenda('${d.id}')">Hapus</button></td>
    </tr>`).join("") : "";
  $("#denda-empty").style.display = denda.length ? "none" : "block";
  $("#total-denda").textContent = rp(denda.reduce((s, d) => s + Number(d.jumlah || 0), 0));
}

function hapusDenda(id) {
  denda = denda.filter((d) => d.id !== id);
  save(); renderAll(); toast("Denda dihapus");
}

function renderPunish() {
  const tersisa = laporan.filter((r) => r.status !== "diserahkan");
  $("#tabel-punish").innerHTML = tersisa.length ? tersisa.map((r) => `
    <tr>
      <td><b>${esc(r.owner)}</b></td>
      <td>${esc(r.nama)}</td>
      <td>
        <select class="input punish-sel" data-id="${r.id}" style="max-width:280px">
          <option value="">— Tidak ada —</option>
          ${pengaturan.punishment.map((p) => `<option ${r.hukuman === p ? "selected" : ""}>${esc(p)}</option>`).join("")}
        </select>
      </td>
      <td>
        ${r.hukuman
          ? `<button class="btn btn-sm ${r.hukumanSelesai ? "ok" : "nodone"}" onclick="toggleHukuman('${r.id}')">
             ${r.hukumanSelesai ? "✓ Selesai" : "⏳ Belum"}</button>`
          : '<span style="color:var(--muted);font-size:12.5px">—</span>'}
      </td>
    </tr>`).join("") : "";
  $("#punish-empty").style.display = tersisa.length ? "none" : "block";
}

function toggleHukuman(id) {
  const r = laporan.find((x) => x.id === id);
  if (!r) return;
  r.hukumanSelesai = !r.hukumanSelesai;
  save(); renderAll(); toast("Status hukuman diperbarui ✓");
}

$("#tabel-punish").addEventListener("change", (e) => {
  if (!e.target.classList.contains("punish-sel")) return;
  const r = laporan.find((x) => x.id === e.target.dataset.id);
  if (!r) return;
  r.hukuman = e.target.value;
  if (!r.hukuman) r.hukumanSelesai = false;
  save(); renderAll();
});

function renderPunishBuilder() {
  $("#punish-list").innerHTML = pengaturan.punishment.length ? pengaturan.punishment.map((p, i) => `
    <li>${esc(p)}<button class="remove" onclick="hapusPunish(${i})">✕</button></li>`).join("")
    : `<li style="background:#fff7ed;color:var(--gold)">Belum ada pilihan hukuman.</li>`;
  const f = $("#f-hukuman");
  f.innerHTML = `<option value="">— Tidak ada —</option>` +
    pengaturan.punishment.map((p) => `<option>${esc(p)}</option>`).join("");
}

$("#form-punish").addEventListener("submit", (e) => {
  e.preventDefault();
  const p = $("#punish-new").value.trim();
  if (!p) return;
  if (pengaturan.punishment.includes(p)) { toast("Hukuman sudah ada"); return; }
  pengaturan.punishment.push(p);
  save(); renderPunishBuilder(); renderAll(); toast("Pilihan hukuman ditambahkan ✓");
  $("#form-punish").reset();
});

function hapusPunish(i) {
  pengaturan.punishment.splice(i, 1);
  laporan.forEach((r) => {
    if (!pengaturan.punishment.includes(r.hukuman)) { r.hukuman = ""; r.hukumanSelesai = false; }
  });
  save(); renderPunishBuilder(); renderAll(); toast("Pilihan hukuman dihapus");
}

/* ============ Render: Grafik ============ */
function renderGrafik() {
  const byOwner = pemilikTerbanyak();
  barChart("grafik-owner", "grafik-owner-empty", byOwner);

  const byKat = CATEGORIES.map((k) => ({ label: k, value: laporan.filter((r) => r.kategori === k).length }))
    .filter((e) => e.value > 0);
  pieChart("grafik-kat", "grafik-kat-empty", "grafik-kat-legend", byKat);

  const byBulan = {};
  denda.forEach((d) => { const k = bulanKey(d.tanggal); byBulan[k] = (byBulan[k] || 0) + Number(d.jumlah || 0); });
  const entries = Object.entries(byBulan).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({ label: bulanLabel(k), value: v }));
  const el = $("#grafik-denda");
  const max = Math.max(...entries.map((e) => e.value), 1);
  el.innerHTML = entries.map((e) => `
    <div class="bar-row">
      <div class="bar-label">${e.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(3, (e.value / max) * 100)}%;background:linear-gradient(90deg,#d97706,#f59e0b)"></div></div>
      <div class="bar-value">${rp(e.value)}</div>
    </div>`).join("");
  $("#grafik-denda-empty").style.display = entries.length ? "none" : "block";
}

/* ============ Datalist pemilik ============ */
function renderDatalist() {
  const owners = [...new Set(laporan.map((r) => r.owner))];
  $("#daftar-pemilik").innerHTML = owners.map((o) => `<option value="${esc(o)}">`).join("");
}

/* ============ Backup / Restore / Reset ============ */
$("#btn-export").addEventListener("click", () => {
  const data = { pengaturan, laporan, denda, _export: "bendahara-barang-hilang", _v: 1, _date: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup-bendahara-" + today() + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Backup diunduh ✓");
});

$("#btn-import").addEventListener("click", () => $("#file-import").click());
$("#file-import").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      laporan = Array.isArray(d.laporan) ? d.laporan : [];
      denda = Array.isArray(d.denda) ? d.denda : [];
      pengaturan = Object.assign({ punishment: DEF_PUNISH }, d.pengaturan || {});
      save(); renderAll(); toast("Data berhasil dipulihkan ✓");
    } catch { toast("File tidak valid!"); }
  };
  reader.readAsText(file);
  e.target.value = "";
});

$("#btn-reset").addEventListener("click", () => {
  if (!confirm("Hapus SEMUA data (laporan, denda, hukuman)? Tindakan ini tidak bisa dibatalkan!")) return;
  if (!confirm("Yakin benar-benar ingin reset?")) return;
  laporan = []; denda = []; pengaturan = { punishment: DEF_PUNISH };
  save(); renderAll(); toast("Semua data direset");
});

/* ============ Listeners umum ============ */
["cari-barang", "filter-status"].forEach((id) => $("#" + id).addEventListener("input", renderBarang));
$("#cari-found").addEventListener("input", renderFound);

function renderAll() {
  renderDashboard();
  renderBarang();
  renderFound();
  renderSelectLaporan();
  renderDenda();
  renderPunish();
  renderPunishBuilder();
  renderGrafik();
  renderDatalist();
}

renderAll();