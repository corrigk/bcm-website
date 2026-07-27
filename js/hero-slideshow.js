/* Renders the home page hero slideshow from BCM_CONFIG.HERO_IMAGES.
   Zero images -> a quiet placeholder. One image -> static. Two or
   more -> auto-advancing cross-fade. */
function bcmRenderHeroSlideshow(){
  const el = document.getElementById('hero-slideshow');
  if (!el) return;

  const images = (typeof BCM_CONFIG !== 'undefined' && BCM_CONFIG.HERO_IMAGES) || [];

  if (images.length === 0){
    el.innerHTML = `
      <div style="height:100%; display:flex; align-items:center; justify-content:center; padding:24px; text-align:center;">
        <p class="muted" style="color:var(--gold); margin:0;">
          Add a photo to <code>images/hero/</code> and list it in
          <code>HERO_IMAGES</code> (js/config.js) to show it here.
        </p>
      </div>
    `;
    return;
  }

  el.innerHTML = images.map((src, i) =>
    `<img src="${src}" alt="Boiler Catholic Men" class="hero-slide${i === 0 ? ' active' : ''}">`
  ).join('');

  if (images.length > 1){
    const slides = el.querySelectorAll('.hero-slide');
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', bcmRenderHeroSlideshow);
