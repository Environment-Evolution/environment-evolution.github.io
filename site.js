(() => {
  const imageTriggers = [...document.querySelectorAll('[data-image-src]')];
  if (imageTriggers.length) {
    const viewer = document.createElement('dialog');
    viewer.className = 'image-viewer';
    viewer.setAttribute('aria-labelledby', 'image-viewer-title');
    viewer.setAttribute('aria-describedby', 'image-viewer-caption');
    viewer.innerHTML = `
      <div class="image-viewer-header">
        <h2 id="image-viewer-title">Figure preview</h2>
        <div class="image-viewer-actions">
          <button type="button" class="button" data-viewer-zoom aria-pressed="false">Zoom in</button>
          <button type="button" class="button" data-viewer-close aria-label="Close image preview" autofocus>Close <span aria-hidden="true">×</span></button>
        </div>
      </div>
      <div class="image-viewer-viewport"><img class="image-viewer-image" alt=""></div>
      <p id="image-viewer-caption" class="image-viewer-caption"></p>`;
    document.body.append(viewer);
    const image = viewer.querySelector('img');
    const caption = viewer.querySelector('.image-viewer-caption');
    const viewport = viewer.querySelector('.image-viewer-viewport');
    const zoom = viewer.querySelector('[data-viewer-zoom]');
    let opener;

    function resetZoom() {
      viewer.classList.remove('is-zoomed');
      zoom.setAttribute('aria-pressed', 'false');
      zoom.textContent = 'Zoom in';
      viewport.scrollTo(0, 0);
    }

    imageTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const original = trigger.querySelector('img') ||
          [...document.querySelectorAll('figure img')].find(img => img.getAttribute('src') === trigger.dataset.imageSrc);
        if (!original) return;
        opener = trigger;
        resetZoom();
        image.src = original.src;
        image.alt = original.alt;
        caption.textContent = original.closest('figure').querySelector('figcaption')?.textContent || original.alt;
        viewer.showModal();
        document.documentElement.classList.add('image-preview-open');
      });
    });
    zoom.addEventListener('click', () => {
      const enlarged = viewer.classList.toggle('is-zoomed');
      zoom.setAttribute('aria-pressed', String(enlarged));
      zoom.textContent = enlarged ? 'Fit image' : 'Zoom in';
      viewport.scrollTo(0, 0);
    });
    viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
    // Native dialog handles Escape, focus trapping, and background inertness.
    viewer.addEventListener('click', event => {
      if (event.target === viewer) viewer.close();
    });
    viewer.addEventListener('close', () => {
      document.documentElement.classList.remove('image-preview-open');
      resetZoom();
      opener?.focus({ preventScroll: true });
      image.removeAttribute('src');
    });
  }

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(selected) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });

  const copy = document.getElementById('copy-citation');
  const status = document.getElementById('copy-status');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById('bibtex').textContent);
      status.textContent = 'Citation copied.';
    } catch {
      status.textContent = 'Select the citation text above to copy it.';
      document.querySelector('pre').focus();
    }
  });
})();
