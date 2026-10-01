(() => {
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
