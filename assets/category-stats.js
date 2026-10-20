(function () {
  'use strict';
  var data = JSON.parse(document.getElementById('category-heatmap-data').textContent);
  var years = Object.keys(data.years).sort(), level = 'major';
  var total = years.reduce(function (n, y) { return n + data.years[y].length; }, 0);
  var colors = ['#d5e2dc','#d8d2e2','#e7d3de','#cbdbe5','#ecd3c9','#c9d8e0','#e1e5cd','#e8d8c9','#d8d2df','#eee3c9','#e0e3e0'];
  function el(tag, text, parent, cls) { var e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function id(s) { return document.getElementById(s); }
  function code(value) { var s = String(value == null ? '' : value).trim(); return /^\d{3}(\.\d+)?(?:\/\d{3}(\.\d+)?)*$/.test(s) ? s : null; }
  function key(value, mode) { var c = code(value); return c ? (mode === 'major' ? c[0] + '00' : mode === 'section' ? c.slice(0, 3) : c.slice(0, 2) + '0') : 'unknown'; }
  function label(k, mode) { return k === 'unknown' ? '未分類／分類號缺漏' : (mode === 'major' ? data.majors : mode === 'section' ? data.sections : data.labels)[k] || '類目名稱缺漏'; }
  function rows(mode, subset) {
    var map = {}; Object.keys(mode === 'major' ? data.majors : mode === 'section' ? data.sections : data.labels).forEach(function (k) { map[k] = 0; });
    (subset || years).forEach(function (y) { data.years[y].forEach(function (v) { var k = key(v, mode); map[k] = (map[k] || 0) + 1; }); });
    return Object.keys(map).map(function (k) { return {code:k, count:map[k]}; }).sort(function (a,b) { return b.count-a.count || a.code.localeCompare(b.code); });
  }
  function pct(n,d) { return (d ? n/d*100 : 0).toFixed(1) + '%'; }
  function link(parent, row, mode, year) {
    var a = el('a', (row.code === 'unknown' ? '—' : row.code) + ' ' + label(row.code, mode), parent);
    var query = 'category:' + (mode === 'major' && row.code !== 'unknown' ? row.code[0] + '*' : mode === 'section' && row.code !== 'unknown' ? row.code + '*' : row.code);
    a.href = '/?q=' + encodeURIComponent((year ? 'year:' + year + ' ' : '') + query); return a;
  }
  var largest = rows('major').find(function(r){return r.code === '800';});
  id('category-total-value').textContent = total.toLocaleString('zh-TW');
  id('category-period-value').textContent = years.length + ' 年';
  id('category-period-detail').textContent = years[0] + '–' + years[years.length-1] + '・末年截至目前';
  id('category-largest-value').textContent = largest && largest.count ? pct(largest.count,total) : '—';
  id('category-largest-detail').textContent = largest && largest.count ? largest.code + ' ' + label(largest.code,'major') + '・' + largest.count + ' 本' : '尚無分類資料';
  function render() {
    var body=id('category-heatmap-body'); body.replaceChildren();
    rows(level).filter(function(r){return level === 'major' || r.count;}).forEach(function(r){
      var tr=el('tr',undefined,body), th=el('th',undefined,tr); th.scope='row'; link(th,r,level);
      var td=el('td',undefined,tr), a=el('a',r.count,td); a.href=th.firstChild.href;
      td=el('td',undefined,tr); a=el('a',undefined,td); a.href=th.firstChild.href;
      var bar=el('span',undefined,a,'category-heatmap__bar'); bar.setAttribute('aria-hidden','true'); var fill=el('i',undefined,bar); fill.style.width=pct(r.count,total); if(!r.count) fill.style.minWidth='0'; el('span',pct(r.count,total),a);
    });
    var foot=id('category-heatmap-total'); foot.replaceChildren(); var tr=el('tr',undefined,foot); el('th','已讀合計',tr).scope='row'; el('td',total,tr); el('td',total ? '100%' : '0%',tr);
    document.querySelectorAll('[data-level]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.level===level));});
  }
  document.querySelectorAll('[data-level]').forEach(function(b){ b.addEventListener('click',function(){ level=b.dataset.level; render(); }); });
  // Annual charts always use the ten broad classes for a stable comparison.
  var keys=Object.keys(data.majors).sort();
  if (years.some(function(y) { return data.years[y].some(function(v) { return !code(v); }); })) keys.push('unknown');
  keys.forEach(function(k,i){var item=el('span',undefined,id('category-legend')); var swatch=el('i',undefined,item); swatch.style.backgroundColor=colors[i]; el('span',(k==='unknown'?'—':k)+' '+label(k,'major'),item);});
  var chartDescriptions=[];
  years.slice().reverse().forEach(function(y){
    var n=data.years[y].length, annual=rows('major',[y]), counts={}; annual.forEach(function(r){counts[r.code]=r.count;});
    var row=el('div',undefined,id('category-year-chart'),'category-year-row'); el('span',y+'・'+n+' 本',row); var bar=el('div',undefined,row,'category-year-bar');
    keys.forEach(function(k,i){var count=counts[k]||0, text=y+' '+label(k,'major')+'：'+count+' 本（'+Math.round(count/n*100)+'%）';
      if(count){var segment=link(bar,{code:k},'major',y); segment.textContent=''; segment.style.width=(count/n*100)+'%'; segment.style.backgroundColor=colors[i]; segment.title=text; segment.setAttribute('aria-label',text); segment.dataset.label=Math.round(count/n*100)+'%';}
    });
    if(!n) el('span','無已讀紀錄',bar);
    chartDescriptions.push(y+' 年 '+n+' 本');
  });
  id('category-year-chart').setAttribute('aria-label',chartDescriptions.join('；')+'。各色塊標示分類、本數與占比。');
  function fitAnnualLabels() {
    var canvas = document.createElement('canvas'), context = canvas.getContext('2d');
    document.querySelectorAll('.category-year-bar a').forEach(function(segment) {
      var style = window.getComputedStyle(segment);
      context.font = style.fontSize + ' ' + style.fontFamily;
      segment.textContent = context.measureText(segment.dataset.label).width + 6 <= segment.clientWidth ? segment.dataset.label : '';
    });
  }
  fitAnnualLabels();
  if (window.ResizeObserver) new ResizeObserver(fitAnnualLabels).observe(id('category-year-chart'));
  else window.addEventListener('resize', fitAnnualLabels);
  if (document.fonts) document.fonts.ready.then(fitAnnualLabels);
  render();
})();
