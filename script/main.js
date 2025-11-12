// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------
     Smooth Scrolling for Anchors
  ----------------------------- */
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /* -----------------------------
     Header Scroll Effect
  ----------------------------- */
  function setupHeaderScrollEffect() {
    const header = document.querySelector('header');
    if (!header) return;

    let ticking = false;

    function updateHeaderShadow() {
      const currentScroll = window.pageYOffset;
      header.style.boxShadow = currentScroll > 50
        ? '0 2px 30px rgba(0,0,0,0.1)'
        : '0 2px 20px rgba(0,0,0,0.05)';
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderShadow);
        ticking = true;
      }
    }, { passive: true });
  }

  /* -----------------------------
     Fade-in Animations
  ----------------------------- */
  function setupAnimations() {
    const cards = document.querySelectorAll('.feature-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    cards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.2}s`;
      observer.observe(card);
    });
  }
  /* -----------------------------
   Hall Details Modal
----------------------------- */
function setupHallModal() {
  const modal = document.getElementById('hallModal');
  const closeBtn = modal.querySelector('.modal-close');
  const hallName = document.getElementById('hallName');
  const hallLocation = document.getElementById('hallLocation');
  const hallDescription = document.getElementById('hallDescription');

  const hallDetails = {
    A: {
      name: 'Sala A',
      location: 'Near main gate',
      desc: 'Spacious hall suitable for 100 guests. Equipped with stage and sound system.'
    },
    B: {
      name: 'Sala B',
      location: 'Behind the temple garden',
      desc: 'Quiet and serene, perfect for small ceremonies or meditation events.'
    },
    C: {
      name: 'Sala C',
      location: 'Next to parking area',
      desc: 'Air-conditioned hall with modern facilities, projector, and Wi-Fi.'
    }
  };

  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', e => {
      const hallKey = e.target.closest('.hall-card').dataset.hall;
      const details = hallDetails[hallKey];

      hallName.textContent = details.name;
      hallLocation.textContent = `📍 ${details.location}`;
      hallDescription.textContent = details.desc;

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // prevent background scroll
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Close modal on background click
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSmoothScroll();
  setupHeaderScrollEffect();
  setupAnimations();
  setupHallModal(); // <— add this line
});


  /* -----------------------------
     Initialize All Features
  ----------------------------- */
  setupSmoothScroll();
  setupHeaderScrollEffect();
  setupAnimations();

});

