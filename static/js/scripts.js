document.addEventListener('DOMContentLoaded', (event) => {
    clearGameState();
    initParticles()

    let product1Price = Math.round(parseFloat(document.querySelector('#product1 .product-price').textContent.slice(1)));
    let product2Price = Math.round(parseFloat(document.querySelector('#product2 .product-price').getAttribute('data-price')));
    let productQueue = [];
    let score = 0;
    let highScore = localStorage.getItem('highScore') || 0;
    let animationIntervals = {};
    updateScoreDisplay();

    function clearGameState() {
        localStorage.removeItem('gameState');
    }

    function prefetchProducts(numToFetch = 5) {
        fetch(`/get_new_products/?num=${numToFetch}`)
            .then(response => response.json())
            .then(data => {
                data.products.forEach(product => {
                    product.price = Math.round(parseFloat(product.price));
                    product.displayPrice = '??';
                    productQueue.push(product);
                });
            })
            .catch(error => {
                console.error('Error prefetching products:', error);
            });
    }

function initParticles() {
    let configPath = document.body.getAttribute('data-particles-config');
    particlesJS.load('particles-js', configPath, function() {
        console.log('Particles.js configuration loaded.');
    });
}

function destroyParticles() {
    if (window.pJSDom) {
        const length = window.pJSDom.length;
        for (let i = 0; i < length; i++) {
            if (window.pJSDom[0] && window.pJSDom[0].pJS && window.pJSDom[0].pJS.fn && window.pJSDom[0].pJS.fn.vendors && window.pJSDom[0].pJS.fn.vendors.destroypJS) {
                window.pJSDom[0].pJS.fn.vendors.destroypJS();
            }
        }
    }
}

function animateValue(obj, start, end, duration, intervalKey) {
    if (animationIntervals[intervalKey]) {
        clearInterval(animationIntervals[intervalKey]);
    }

    obj.innerHTML = `$${start}`;

    const stepTime = Math.abs(Math.floor(duration / (end - start)));
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    let current = start;

    const step = () => {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const value = Math.round(end - (remaining * (end - start)));
        obj.innerHTML = `$${value}`;
        if (value === end) {
            clearInterval(animationIntervals[intervalKey]);
        }
    };

    animationIntervals[intervalKey] = setInterval(step, stepTime);
    step();
}

function handleGuess(isHigherGuess) {
    resetFeedback();
    let correctGuess = (isHigherGuess && product2Price > product1Price) || (!isHigherGuess && product2Price < product1Price);

    document.querySelector('#guessHigherBtn').disabled = true;
    document.querySelector('#guessLowerBtn').disabled = true;

    showFeedback(correctGuess);

    if (correctGuess) {
        score += 1;
        updateHighScore();
        updateScoreDisplay();
        const product2PriceElem = document.querySelector('#product2 .product-price span');
        if (product2PriceElem) {
            animateValue(product2PriceElem, 0, product2Price, 1000, 'product2PriceAnimation');
        } else {
            console.error("The element '#product2 .product-price span' was not found");
        }
    } else {
        score = 0;
        updateScoreDisplay();
    }

    setTimeout(() => {
        if (!correctGuess) {
            document.getElementById('wrongGuessSplash').style.display = 'flex';
            document.getElementById('displayHighScore').textContent = highScore;
            clearGameState();
            prefetchProduct();
            prefetchProduct();
            return;
        }

        let product1 = document.querySelector('#product1');
        let product2 = document.querySelector('#product2');

        product1.classList.add('animate__animated', 'animate__slideOutLeft');
        product2.classList.add('animate__animated', 'animate__slideOutLeft');

        product2.addEventListener('animationend', function handler() {
            product2.removeEventListener('animationend', handler);

            product1.style.backgroundImage = product2.style.backgroundImage;
            document.querySelector('#product1 h2').textContent = document.querySelector('#product2 h2').textContent;
            document.querySelector('#product1 .product-price').textContent = `$${product2Price}`;
            document.querySelector('#product1 .product-price').setAttribute('data-price', product2Price.toFixed(2));

            product1Price = product2Price;

            product1.classList.remove('animate__animated', 'animate__slideOutLeft');

            if (productQueue.length) {
                const nextProduct = productQueue.shift();
                product2.style.backgroundImage = `url(${nextProduct.image_url})`;
                document.querySelector('#product2 h2').textContent = nextProduct.name;
                document.querySelector('#product2 .product-price').setAttribute('data-price', parseFloat(nextProduct.price).toFixed(2));
                document.querySelector('#product2 .product-price span').textContent = '??';
                product2Price = parseFloat(nextProduct.price);

                product2.classList.remove('animate__animated', 'animate__slideOutLeft');
                product2.classList.add('animate__animated', 'animate__slideInRight');
            }

            product2.addEventListener('animationend', function cleanup() {
                product2.classList.remove('animate__animated', 'animate__slideInRight');
                if (productQueue.length < 2) {
                    prefetchProducts();
                }
                document.querySelector('#guessHigherBtn').disabled = false;
                document.querySelector('#guessLowerBtn').disabled = false;
            });
        });
    }, 2000);
}

function showFeedback(correctGuess) {
    const correctIcon = document.getElementById('correctIcon');
    const wrongIcon = document.getElementById('wrongIcon');
    const vsDivider = document.querySelector('.divider span');

    anime({
      targets: vsDivider,
      opacity: 0,
      duration: 1000,
      easing: 'easeInOutQuad'
    });

    if (correctGuess) {
        correctIcon.src = "/static/imgs/check.gif";
        correctIcon.style.display = 'block';
    } else {
        wrongIcon.src = "/static/imgs/error.gif";
        wrongIcon.style.display = 'block';
    }

    setTimeout(() => {
        correctIcon.style.display = 'none';
        wrongIcon.style.display = 'none';

        anime({
          targets: vsDivider,
          opacity: 1,
          duration: 1000,
          easing: 'easeInOutQuad'
        });
    }, 2000);
}

    function resetFeedback() {
        document.getElementById('correctIcon').classList.remove('animate-feedback');
        document.getElementById('wrongIcon').classList.remove('animate-feedback');
    }

    function updateScoreDisplay() {
    document.querySelector('.score').textContent = "Score: " + score;
    document.querySelector('.high-score').textContent = "High Score: " + highScore;
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('displayHighScore').textContent = highScore;
    }
}

function updateUIFromQueue() {
    let product2 = document.querySelector('#product2');

    if (productQueue.length > 0) {
        const product1 = productQueue.shift();
        document.querySelector('#product1').style.backgroundImage = `url(${product1.image_url})`;
        document.querySelector('#product1 h2').textContent = product1.name;
        document.querySelector('#product1 .product-price').textContent = `$${Math.round(parseFloat(product1.price))}`;

        product1Price = parseFloat(product1.price);
    }

    if (productQueue.length > 0) {
        const nextProduct = productQueue.shift();
        product2.style.backgroundImage = `url(${nextProduct.image_url})`;
        document.querySelector('#product2 h2').textContent = nextProduct.name;
        document.querySelector('#product2 .product-price').setAttribute('data-price', parseFloat(nextProduct.price).toFixed(2));
        document.querySelector('#product2 .product-price span').textContent = '??';
        product2Price = parseFloat(nextProduct.price);

        product2.classList.add('animate__animated', 'animate__slideInRight');
        product2.addEventListener('animationend', function cleanup() {
            product2.classList.remove('animate__animated', 'animate__slideInRight');
        });
    }
}

function fetchNewGif() {
    fetch('/fetch_gif/')
        .then(response => response.json())
        .then(data => {
            const gifUrl = data.gif_url;
            document.getElementById('wrongGuessSplash').style.backgroundImage = `url(${gifUrl})`;
        })
        .catch(error => {
            console.error('Error fetching new GIF:', error);
        });
}

    document.querySelector('#guessHigherBtn').addEventListener('click', function () {
        handleGuess(true);
    });

    document.querySelector('#guessLowerBtn').addEventListener('click', function () {
        handleGuess(false);
    });

    document.getElementById('playButton').addEventListener('click', function () {
        document.getElementById('splashScreen').classList.add('hide');
        destroyParticles();
        setTimeout(() => {
            document.getElementById('splashScreen').style.display = 'none';
            document.querySelector('.game-container').style.display = 'flex';
        }, 500);
    });

document.getElementById('playAgainButton').addEventListener('click', function () {
    document.getElementById('wrongGuessSplash').style.display = 'none';

    clearGameState();
    fetchNewGif();

    document.querySelector('#guessHigherBtn').disabled = false;
    document.querySelector('#guessLowerBtn').disabled = false;
    document.querySelector('.game-container').style.display = 'flex';

    if (productQueue.length >= 2) {
        updateUIFromQueue();
    } else {
        document.querySelector('#product1').style.backgroundImage = '';
        document.querySelector('#product1 h2').textContent = '';
        document.querySelector('#product1 .product-price').textContent = '';
        document.querySelector('#product2').style.backgroundImage = '';
        document.querySelector('#product2 h2').textContent = '';
        document.querySelector('#product2 .product-price span').textContent = '??';

        prefetchProduct();
        prefetchProduct();
    }
});

    prefetchProducts(10);
});