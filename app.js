let sides = {
    left: {
        score: 0,
        sets: 0,
        id: 'left', // references the initial DOM side
        color: 'bg-blue'
    },
    right: {
        score: 0,
        sets: 0,
        id: 'right',
        color: 'bg-cyan' // changed from red to cyan for default
    }
};

// Global mapping of colors to team names
const globalTeamNames = {
    'bg-blue': '藍隊',
    'bg-cyan': '青隊',
    'bg-black': '黑隊',
    'bg-pink': '粉隊'
};

window.updateGlobalTeamName = function(colorClass, newName) {
    globalTeamNames[colorClass] = newName;
    
    // Update all input fields that belong to this color
    document.querySelectorAll(`.input-${colorClass}`).forEach(input => {
        if(input.value !== newName) {
            input.value = newName;
        }
    });
    
    // If any side is currently using this color, update their large name!
    if(sides.left.color === colorClass) {
        els.left.name.textContent = newName;
    }
    if(sides.right.color === colorClass) {
        els.right.name.textContent = newName;
    }
}

// Elements
const els = {
    left: {
        court: document.getElementById('court-left'),
        score: document.getElementById('score-left'),
        sets: document.getElementById('sets-left'),
        name: document.getElementById('name-left')
    },
    right: {
        court: document.getElementById('court-right'),
        score: document.getElementById('score-right'),
        sets: document.getElementById('sets-right'),
        name: document.getElementById('name-right')
    }
};

// Initialize Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
}

// Touch handling variables
let touchStartY = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 50; // pixels

// Setup Listeners
function setupCourtListeners(side) {
    const court = els[side].court;
    
    court.addEventListener('touchstart', e => {
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    court.addEventListener('touchend', e => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe(side);
    }, {passive: true});
}

setupCourtListeners('left');
setupCourtListeners('right');

function handleSwipe(side) {
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0) {
            // Swipe down -> Decrease score
            updateScore(side, -1);
        } else {
            // Swipe up -> Increase score
            updateScore(side, 1);
            createActionParticles(els[side].score);
        }
    }
}

function updateScore(side, change) {
    const newScore = sides[side].score + change;
    if (newScore >= 0) { // Badminton scores cannot be negative
        sides[side].score = newScore;
        updateDOM(side);
        animateScore(els[side].score, change > 0 ? 'pop' : 'shrink');
    }
}

// Ensure updateSets is globally available for inline onclick
window.updateSets = function(side, change) {
    const newSets = sides[side].sets + change;
    if (newSets >= 0) {
        sides[side].sets = newSets;
        updateDOM(side);
    }
}

window.setCourtColor = function(side, colorClass) {
    sides[side].color = colorClass;
    els[side].name.textContent = globalTeamNames[colorClass];
    updateDOM(side);
}

const colorClasses = ['bg-blue', 'bg-cyan', 'bg-black', 'bg-pink'];

function updateDOM(side) {
    els[side].score.textContent = sides[side].score;
    els[side].sets.textContent = sides[side].sets;
    
    // Apply background color class
    colorClasses.forEach(c => els[side].court.classList.remove(c));
    els[side].court.classList.add(sides[side].color);
}

// Initial paint
updateDOM('left');
updateDOM('right');

function animateScore(element, type) {
    element.classList.remove('pop', 'shrink');
    // void element.offsetWidth; // trigger reflow
    setTimeout(() => {
        element.classList.add(type);
        setTimeout(() => {
            element.classList.remove(type);
        }, 150);
    }, 10);
}

function createActionParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        document.body.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.transition = 'all 0.5s cubic-bezier(0.1, 0.8, 0.3, 1)';
        particle.style.opacity = '1';
        
        setTimeout(() => {
            particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
            particle.style.opacity = '0';
        }, 50);
        
        setTimeout(() => particle.remove(), 600);
    }
}

// Swap Sides Logic
document.getElementById('btn-swap').addEventListener('click', () => {
    // We swap the data and the names between left and right sides visually
    
    const leftName = els.left.name.innerHTML;
    const rightName = els.right.name.innerHTML;
    
    // Animate out
    els.left.court.classList.add('swap-fade-out');
    els.right.court.classList.add('swap-fade-out');
    
    setTimeout(() => {
        // Swap names
        els.left.name.innerHTML = rightName;
        els.right.name.innerHTML = leftName;
        
        // Swap state
        const tempState = { ...sides.left };
        sides.left = { ...sides.right };
        sides.right = tempState;
        
        // Update DOM with new state
        updateDOM('left');
        updateDOM('right');
        
        // Remove fade out, add fade in
        els.left.court.classList.remove('swap-fade-out');
        els.right.court.classList.remove('swap-fade-out');
        
        els.left.court.classList.add('swap-fade-in');
        els.right.court.classList.add('swap-fade-in');
        
        setTimeout(() => {
            els.left.court.classList.remove('swap-fade-in');
            els.right.court.classList.remove('swap-fade-in');
        }, 400);
    }, 300);
});

// Reset logic
document.getElementById('btn-reset').addEventListener('click', () => {
    if(confirm('確定要重置所有分數與局數嗎？')) {
        sides.left.score = 0;
        sides.left.sets = 0;
        sides.right.score = 0;
        sides.right.sets = 0;
        updateDOM('left');
        updateDOM('right');
    }
});
