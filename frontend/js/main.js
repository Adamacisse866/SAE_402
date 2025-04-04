document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const startButton = document.getElementById('start-button');
    const graphContainer = document.getElementById('graph-container');
    const movieTitleElement = document.getElementById('movie-title');
    const guessedActorsElement = document.getElementById('guessed-actors');

    let graph;
    let currentElement;
    let connectedElements = [];
    let guessedElements = new Set();
    let selectedElementId = null;
    let allNodes = new Map(); // Pour stocker tous les nœuds du graphe
    let allLinks = new Set(); // Pour stocker tous les liens du graphe
    let score = 0; // Ajout du score
    let combo = 0; // Ajout du combo pour les bonus
    let currentLevel = 1;
    const POINTS_FOR_NEXT_LEVEL = {
        1: 500,
        2: 1000
    };

    // Configuration des niveaux
    const LEVEL_CONFIG = {
        1: {
            hintCost: 5,
            wrongAnswerPenalty: -10,
            maxCombo: 3,
            pointsPerCorrectAnswer: 50,
            maxHintsPerGuess: null,
            timeLimit: null
        },
        2: {
            hintCost: 10,
            wrongAnswerPenalty: -20,
            maxCombo: 7,
            pointsPerCorrectAnswer: 75,
            maxHintsPerGuess: 4,
            timeLimit: 30,
            powers: {
                focus: {
                    cost: 300,
                    description: "Révèle le genre du film ou le type d'acteur",
                    duration: 0,
                    type: "information"
                },
                insight: {
                    cost: 600,
                    description: "Révèle une connexion majeure (film culte ou rôle important)",
                    duration: 0,
                    type: "hint"
                },
                revelation: {
                    cost: 900,
                    description: "Révèle une lettre de votre choix dans le mot à deviner",
                    duration: 0,
                    type: "custom"
                }
            }
        }
    };

    // Ajout des variables pour le timer
    let timerInterval;
    let timeLeft;

    // Création de l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Création du conteneur de devinette
    const guessContainer = document.createElement('div');
    guessContainer.id = 'guess-container';
    guessContainer.innerHTML = `
        <div class="guess-content">
            <div class="guess-image-container">
                <img id="guess-image" src="placeholder.jpg" alt="Image à deviner">
            </div>
            <div class="guess-input-container">
                <h3 id="guess-question" class="guess-question"></h3>
                <div class="hint-section">
                    <div id="current-hint" class="current-hint"></div>
                    <button id="get-hint" class="hint-button">
                        Obtenir un indice (-5 points)
                    </button>
                </div>
                <input type="text" id="element-guess" placeholder="Entrez votre réponse..." autocomplete="off">
                <div class="guess-buttons">
                    <button id="cancel-guess">Annuler</button>
                    <button id="submit-guess">Deviner</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(guessContainer);

    // Création du conteneur de debug
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.innerHTML = `
        <h3>Mode Debug</h3>
        <div class="debug-section">
            <h4>Élément de départ :</h4>
            <div id="debug-start"></div>
        </div>
        <div class="debug-section">
            <h4>Réponses possibles :</h4>
            <div id="debug-answers"></div>
        </div>
        <div class="debug-section">
            <h4>Nouvelles connexions :</h4>
            <div id="debug-connections"></div>
        </div>
    `;
    document.body.appendChild(debugContainer);

    // Création du conteneur de score
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score-container';
    scoreContainer.innerHTML = `
        <div class="score-content">
            <div class="current-score">Score: <span id="score-value">0</span></div>
            <div class="combo-multiplier">Combo: <span id="combo-value">x1</span></div>
        </div>
    `;
    document.body.appendChild(scoreContainer);

    // Création du conteneur de niveau
    const levelContainer = document.createElement('div');
    levelContainer.id = 'level-container';
    levelContainer.innerHTML = `
        <div class="level-content">
            <div class="current-level">Niveau <span id="level-value">1</span></div>
            <div class="level-progress">
                <div class="progress-bar">
                    <div id="progress-fill"></div>
                </div>
                <div class="progress-text">
                    <span id="current-points">0</span>/<span id="points-needed">${POINTS_FOR_NEXT_LEVEL[currentLevel]}</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(levelContainer);

    // Création de la modal de niveau suivant
    const nextLevelModal = document.createElement('div');
    nextLevelModal.id = 'next-level-modal';
    nextLevelModal.className = 'modal';
    nextLevelModal.innerHTML = `
        <div class="modal-content">
            <h2>Félicitations !</h2>
            <p>Vous avez atteint ${POINTS_FOR_NEXT_LEVEL[currentLevel]} points et terminé le niveau ${currentLevel} !</p>
            <p>Prêt pour le niveau ${currentLevel + 1} ?</p>
            <div class="modal-buttons">
                <button id="continue-level">Continuer niveau ${currentLevel}</button>
                <button id="next-level">Passer au niveau ${currentLevel + 1}</button>
            </div>
        </div>
    `;
    document.body.appendChild(nextLevelModal);

    const elementGuessInput = document.getElementById('element-guess');
    const submitGuessButton = document.getElementById('submit-guess');
    const cancelGuessButton = document.getElementById('cancel-guess');
    const debugAnswersElement = document.getElementById('debug-answers');
    const debugStartElement = document.getElementById('debug-start');
    const debugConnectionsElement = document.getElementById('debug-connections');

    // Variables pour le système d'indices
    let currentAnswer = '';
    let revealedIndices = new Set();
    let hintCost = 5;

    // Création du conteneur de boutons
    const saveButtonsContainer = document.createElement('div');
    saveButtonsContainer.className = 'save-buttons-container';
    saveButtonsContainer.innerHTML = `
        <button class="new-game-button">
            <span>Nouvelle partie</span>
        </button>
        <button class="load-button">
            <span>Charger la dernière partie</span>
        </button>
        <button class="stats-button">
            <span>Voir les statistiques</span>
        </button>
    `;
    document.body.appendChild(saveButtonsContainer);

    // Modification des constantes pour les badges
    const BADGES = {
        BRONZE: {
            name: 'Badge Bronze',
            description: 'Obtenu en atteignant un combo x3 (5 réponses minimum)',
            icon: '🥉',
            color: '#cd7f32',
            comboRequired: 3,
            minAnswers: 5,
            maxUses: 1,
            uses: 0
        },
        SILVER: {
            name: 'Badge Argent',
            description: 'Obtenu en atteignant un combo x7 (10 réponses minimum)',
            icon: '🥈',
            color: '#c0c0c0',
            comboRequired: 7,
            minAnswers: 10,
            maxUses: 2,
            uses: 0
        },
        GOLD: {
            name: 'Badge Or',
            description: 'Obtenu en atteignant un combo x12 (10 réponses minimum)',
            icon: '🥇',
            color: '#ffd700',
            comboRequired: 12,
            minAnswers: 10,
            maxUses: 3,
            uses: 0
        }
    };

    // Ajout des variables pour les badges
    let earnedBadges = new Set();
    let availableBadges = new Set();

    // Ajout des variables pour suivre les réponses
    let totalAnswers = 0;
    let correctAnswers = 0;

    // Fonction pour ajouter un nœud au graphe
    function addNode(node) {
        if (!allNodes.has(node.id)) {
            allNodes.set(node.id, node);
            return true;
        }
        return false;
    }

    // Fonction pour ajouter un lien au graphe
    function addLink(sourceId, targetId) {
        const linkKey = `${sourceId}-${targetId}`;
        if (!allLinks.has(linkKey)) {
            allLinks.add(linkKey);
            return true;
        }
        return false;
    }

    // Fonction pour obtenir les données du graphe
    function getGraphData() {
        return {
            nodes: Array.from(allNodes.values()),
            links: Array.from(allLinks).map(linkKey => {
                const [sourceId, targetId] = linkKey.split('-');
                return { source: sourceId, target: targetId };
            })
        };
    }

    // Fonction pour récupérer les connexions d'un élément
    async function fetchConnections(elementId, type) {
        try {
            if (type === 'movie') {
                const actorsResponse = await fetch(`http://localhost:3000/api/movies/${elementId}/actors`);
                const actors = await actorsResponse.json();
                return actors.map(actor => ({
                    id: actor.id,
                    type: 'actor',
                    data: {
                        id: actor.id,
                        name: actor.name,
                        title: null
                    },
                    hidden: true
                }));
            } else {
                const moviesResponse = await fetch(`http://localhost:3000/api/actors/${elementId}/movies`);
                const movies = await moviesResponse.json();
                return movies.map(movie => ({
                    id: movie.id,
                    type: 'movie',
                    data: {
                        id: movie.id,
                        title: movie.title,
                        name: null
                    },
                    hidden: true
                }));
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des connexions:', error);
            return [];
        }
    }

    // Fonction pour mettre à jour l'affichage du debug
    function updateDebugDisplay() {
        // Afficher l'élément de départ
        if (currentElement) {
            debugStartElement.innerHTML = `
                <div class="debug-element">
                    <strong>${currentElement.type === 'movie' ? 'Film' : 'Acteur'}:</strong> 
                    ${currentElement.title || currentElement.name}
                </div>
            `;
        }

        // Afficher les réponses possibles initiales
        const initialAnswersList = connectedElements
            .filter(element => Array.from(allLinks).some(link => {
                const [sourceId, targetId] = link.split('-');
                return (sourceId === currentElement.id && targetId === element.id) ||
                       (sourceId === element.id && targetId === currentElement.id);
            }))
            .map(element => {
                const name = element.type === 'movie' ? element.data.title : element.data.name;
                const isGuessed = guessedElements.has(element.id);
                return `
                    <div class="debug-answer ${isGuessed ? 'guessed' : ''}">
                        <strong>${element.type === 'movie' ? 'Film' : 'Acteur'}:</strong> ${name}
                        ${isGuessed ? ' ✓' : ''}
                    </div>
                `;
            }).join('');
        debugAnswersElement.innerHTML = `
            <div class="debug-section">
                <h5>Réponses initiales :</h5>
                ${initialAnswersList}
            </div>
        `;

        // Afficher les nouvelles connexions et leurs réponses possibles
        const newConnections = Array.from(allNodes.values())
            .filter(node => node.id !== currentElement.id && !connectedElements.find(e => e.id === node.id));

        const newConnectionsList = newConnections.map(node => {
            const name = node.type === 'movie' ? node.data.title : node.data.name;
            const isGuessed = guessedElements.has(node.id);
            const connectedTo = Array.from(allLinks)
                .filter(link => {
                    const [sourceId, targetId] = link.split('-');
                    return sourceId === node.id || targetId === node.id;
                })
                .map(link => {
                    const [sourceId, targetId] = link.split('-');
                    const connectedNode = Array.from(allNodes.values())
                        .find(n => n.id === (sourceId === node.id ? targetId : sourceId));
                    return connectedNode ? (connectedNode.type === 'movie' ? connectedNode.data.title : connectedNode.data.name) : '';
                })
                .filter(Boolean)
                .join(', ');

            return `
                <div class="debug-connection ${isGuessed ? 'guessed' : ''}">
                    <div class="connection-header">
                        <strong>${node.type === 'movie' ? 'Film' : 'Acteur'}:</strong> ${name}
                        ${isGuessed ? ' ✓' : ''}
                    </div>
                    <div class="connection-details">
                        <small>Connecté à : ${connectedTo}</small>
                    </div>
                </div>
            `;
        }).join('');

        debugConnectionsElement.innerHTML = `
            <div class="debug-section">
                <h5>Nouvelles connexions :</h5>
                ${newConnectionsList}
            </div>
        `;
    }

    // Fonction pour mettre à jour les éléments connectés
    function updateConnectedElements() {
        // Filtrer les nœuds qui ne sont pas encore devinés et qui sont connectés à l'élément courant
        connectedElements = Array.from(allNodes.values())
            .filter(node => 
                node.id !== currentElement.id && 
                !guessedElements.has(node.id) &&
                Array.from(allLinks).some(link => {
                    const [sourceId, targetId] = link.split('-');
                    return (sourceId === currentElement.id && targetId === node.id) ||
                           (sourceId === node.id && targetId === currentElement.id);
                })
            );
    }

    // Fonction pour mettre à jour la barre de progression
    function updateLevelProgress() {
        const progressFill = document.getElementById('progress-fill');
        const currentPoints = document.getElementById('current-points');
        const progress = (score / POINTS_FOR_NEXT_LEVEL[currentLevel]) * 100;
        progressFill.style.width = `${Math.min(100, progress)}%`;
        currentPoints.textContent = score;
    }

    // Fonction pour mettre à jour la configuration selon le niveau
    function updateLevelConfig() {
        const config = LEVEL_CONFIG[currentLevel];
        hintCost = config.hintCost;
        document.getElementById('get-hint').textContent = `Obtenir un indice (-${hintCost} points)`;
    }

    // Modification de la fonction updateScore pour gérer les niveaux
    function updateScore(points, isSuccess = true) {
        const config = LEVEL_CONFIG[currentLevel];
        const previousScore = score;
        
        if (isSuccess) {
            const comboMultiplier = Math.min(config.maxCombo, 1 + (combo * 0.5));
            const finalPoints = Math.round(points * comboMultiplier);
            
            // Bonus de temps pour le niveau 2
            let timeBonus = 0;
            if (currentLevel === 2 && timeLeft > 0) {
                timeBonus = Math.round((timeLeft / config.timeLimit) * 25); // Jusqu'à 25 points de bonus
            }
            
            score += finalPoints + timeBonus;
            combo++;
            
            const scoreAnimation = document.createElement('div');
            scoreAnimation.className = 'score-animation positive';
            scoreAnimation.textContent = `+${finalPoints}${timeBonus ? ` (+${timeBonus})` : ''}`;
            scoreContainer.appendChild(scoreAnimation);
            
            document.getElementById('score-value').textContent = score;
            document.getElementById('combo-value').textContent = `x${comboMultiplier.toFixed(1)}`;

            // Vérifier si le joueur a atteint le score requis pour le niveau suivant
            if (previousScore < POINTS_FOR_NEXT_LEVEL[currentLevel] && 
                score >= POINTS_FOR_NEXT_LEVEL[currentLevel]) {
                if (currentLevel === 1) {
                    nextLevelModal.style.display = 'flex';
                } else if (currentLevel === 2) {
                    // Fin du jeu au niveau 2
                    Swal.fire({
                        title: 'Félicitations !',
                        text: 'Vous avez terminé le jeu avec succès !',
                        icon: 'success',
                        confirmButtonText: 'Nouvelle partie'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            startGame(false); // Recommencer une nouvelle partie
                        }
                    });
                }
            }

            // Vérifier les badges après la mise à jour du score
            checkAndAwardBadges();
        } else {
            score = Math.max(0, score + points);
            
            const scoreAnimation = document.createElement('div');
            scoreAnimation.className = 'score-animation negative';
            scoreAnimation.textContent = points;
            scoreContainer.appendChild(scoreAnimation);
            
            document.getElementById('score-value').textContent = score;
        }

        updateLevelProgress();

        const animations = document.getElementsByClassName('score-animation');
        if (animations.length > 0) {
            setTimeout(() => {
                animations[0].remove();
            }, 1000);
        }
    }

    // Fonction pour réinitialiser le combo
    function resetCombo() {
        combo = 0;
        document.getElementById('combo-value').textContent = 'x1';
    }

    // Fonction pour obtenir le type de film ou d'acteur
    async function getElementType(elementId, type) {
        try {
            const response = await fetch(`http://localhost:3000/api/${type}s/${elementId}`);
            const data = await response.json();
            
            if (type === 'movie') {
                // Pour les films, on regarde le premier genre
                return data.genres && data.genres.length > 0 ? data.genres[0].toLowerCase() : 'default';
            } else {
                // Pour les acteurs, on regarde leurs films les plus connus
                const moviesResponse = await fetch(`http://localhost:3000/api/actors/${elementId}/movies`);
                const movies = await moviesResponse.json();
                
                // Analyser les genres des films pour déterminer le type d'acteur
                const genres = new Set();
                for (const movie of movies) {
                    if (movie.genres) {
                        movie.genres.forEach(genre => genres.add(genre.toLowerCase()));
                    }
                }
                
                if (genres.has('action')) return 'action';
                if (genres.has('drama')) return 'drama';
                if (genres.has('comedy')) return 'comedy';
                return 'default';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du type:', error);
            return 'default';
        }
    }

    // Modification de la fonction getNewHint
    async function getNewHint() {
        const config = LEVEL_CONFIG[currentLevel];
        
        // Vérifier le nombre maximum d'indices
        if (currentLevel === 2 && revealedIndices.size >= config.maxHintsPerGuess) {
            Swal.fire({
                title: 'Maximum d\'indices atteint !',
                text: `Vous ne pouvez utiliser que ${config.maxHintsPerGuess} indices par devinette au niveau 2.`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (score < config.hintCost) {
            Swal.fire({
                title: 'Points insuffisants !',
                text: `Vous avez besoin de ${config.hintCost} points pour obtenir un indice.`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (currentLevel === 2) {
            // Système de devinettes pour le niveau 2
            const selectedNode = Array.from(allNodes.values()).find(n => n.id === selectedElementId);
            if (!selectedNode) return;

            try {
                // Récupérer les informations Wikipedia
                const response = await fetch(`http://localhost:3000/api/game/${selectedNode.type}s/${selectedNode.id}/wiki`);
                const wikiInfo = await response.json();
                
                if (!wikiInfo || !wikiInfo.extract) {
                    throw new Error('Aucune information disponible');
                }

                // Traduire l'extrait en français
                const translatedExtract = await translateToFrench(wikiInfo.extract);
                
                // Diviser l'extrait en phrases
                const sentences = translatedExtract.split(/[.!?]+/).filter(s => s.trim().length > 0);
                
                // Sélectionner une phrase aléatoire qui n'a pas encore été utilisée
                let availableSentences = sentences.filter((_, index) => !revealedIndices.has(index));
                
                if (availableSentences.length === 0) {
                    Swal.fire({
                        title: 'Plus d\'indices disponibles',
                        text: 'Toutes les informations ont déjà été révélées !',
                        icon: 'info',
                        confirmButtonText: 'OK'
                    });
                    return;
                }

                const randomIndex = Math.floor(Math.random() * availableSentences.length);
                const selectedSentence = availableSentences[randomIndex];
                const originalIndex = sentences.indexOf(selectedSentence);
                
                // Ajouter l'index à la liste des indices révélés
                revealedIndices.add(originalIndex);
                
                // Mettre à jour le score
                updateScore(-config.hintCost, false);
                
                // Afficher l'indice
                Swal.fire({
                    title: `Indice mystère ${revealedIndices.size}`,
                    html: `
                        <div class="quote-hint">
                            <p class="quote">${selectedSentence.trim()}</p>
                        </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la récupération des indices:', error);
                Swal.fire({
                    title: 'Erreur',
                    text: 'Impossible de récupérer les indices pour le moment.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } else {
            // Système original pour le niveau 1
            const unrevealedIndices = [];
            for (let i = 0; i < currentAnswer.length; i++) {
                if (!revealedIndices.has(i) && currentAnswer[i] !== ' ') {
                    unrevealedIndices.push(i);
                }
            }

            if (unrevealedIndices.length === 0) {
                Swal.fire({
                    title: 'Plus d\'indices disponibles',
                    text: 'Toutes les lettres ont déjà été révélées !',
                    icon: 'info',
                    confirmButtonText: 'OK'
                });
                return;
            }

            const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
            revealedIndices.add(randomIndex);
            updateScore(-config.hintCost, false);
            updateHintDisplay();
        }
    }

    // Fonction pour traduire le texte en français
    async function translateToFrench(text) {
        try {
            const response = await fetch('https://api.mymemory.translated.net/get', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                params: {
                    q: text,
                    langpair: 'en|fr'
                }
            });
            const data = await response.json();
            return data.responseData.translatedText;
        } catch (error) {
            console.error('Erreur lors de la traduction:', error);
            return text; // Retourner le texte original en cas d'erreur
        }
    }

    // Fonction pour mettre à jour l'affichage de l'indice
    function updateHintDisplay() {
        const hintDisplay = document.getElementById('current-hint');
        let hint = '';
        
        for (let i = 0; i < currentAnswer.length; i++) {
            if (currentAnswer[i] === ' ') {
                hint += '  ';  // Double espace pour meilleure visibilité
            } else if (revealedIndices.has(i)) {
                hint += currentAnswer[i];
            } else {
                hint += '_';
            }
        }
        
        hintDisplay.textContent = hint.split('').join(' ');  // Ajouter des espaces entre les caractères

        // Mettre à jour le bouton d'indice
        const hintButton = document.getElementById('get-hint');
        const config = LEVEL_CONFIG[currentLevel];
        
        if (currentLevel === 2) {
            const remainingHints = config.maxHintsPerGuess - revealedIndices.size;
            hintButton.textContent = `Obtenir un indice (-${hintCost} points) [${remainingHints} indices restants]`;
        } else {
            const remainingLetters = currentAnswer.replace(/\s/g, '').length - revealedIndices.size;
            hintButton.textContent = `Obtenir un indice (-${hintCost} points) [${remainingLetters} lettres restantes]`;
        }
        hintButton.disabled = score < hintCost || (currentLevel === 2 && revealedIndices.size >= config.maxHintsPerGuess);
    }

    // Fonction pour générer une question aléatoire
    function generateQuestion(element, connectedElements) {
        const questions = {
            movie: [
                "Quel est ce film ?",
                "Pouvez-vous deviner ce film ?",
                "Quel est le titre de ce film ?",
                "Connaissez-vous ce film ?"
            ],
            actor: [
                "Qui est cet acteur ?",
                "Pouvez-vous identifier cet acteur ?",
                "Quel est le nom de cet acteur ?",
                "Connaissez-vous cet acteur ?"
            ]
        };

        // Si nous avons des éléments connectés, on peut poser des questions plus spécifiques
        if (connectedElements && connectedElements.length > 0) {
            if (element.type === 'movie') {
                questions.movie.push(
                    `Ce film fait partie de la filmographie de ${connectedElements[0].name}. Quel est-il ?`,
                    `${connectedElements[0].name} a joué dans ce film, pouvez-vous le nommer ?`
                );
            } else {
                questions.actor.push(
                    `Cet acteur a joué dans ${connectedElements[0].title}. Qui est-ce ?`,
                    `On peut voir cet acteur dans ${connectedElements[0].title}. Pouvez-vous l'identifier ?`
                );
            }
        }

        const questionArray = element.type === 'movie' ? questions.movie : questions.actor;
        return questionArray[Math.floor(Math.random() * questionArray.length)];
    }

    // Fonction pour afficher l'explication du niveau
    function showLevelExplanation(level) {
        const config = LEVEL_CONFIG[level];
        const explanation = document.createElement('div');
        explanation.className = 'level-explanation';
        
        let content = `
            <h2>Niveau ${level}</h2>
            <ul>
                <li>Objectif : Atteindre ${POINTS_FOR_NEXT_LEVEL[level]} points pour passer au niveau suivant</li>
                <li>Points par bonne réponse : <span class="bonus">+${config.pointsPerCorrectAnswer}</span></li>
                <li>Pénalité pour mauvaise réponse : <span class="malus">${config.wrongAnswerPenalty}</span></li>
                <li>Coût d'un indice : <span class="malus">-${config.hintCost}</span> points</li>
                <li>Multiplicateur de combo maximum : <span class="bonus">x${config.maxCombo}</span></li>
        `;

        if (level === 2) {
            content += `
                <li>Limite de temps : <span class="malus">${config.timeLimit} secondes</span></li>
                <li>Maximum d'indices par devinette : <span class="malus">${config.maxHintsPerGuess}</span></li>
                <li>Bonus de temps : <span class="bonus">+25 points maximum</span> si vous répondez rapidement</li>
            `;
        }

        content += `
            </ul>
            <button>Commencer le niveau ${level}</button>
        `;
        
        explanation.innerHTML = content;
        document.body.appendChild(explanation);

        explanation.querySelector('button').addEventListener('click', async () => {
            explanation.remove();
            if (level === 1) {
                await startGame(true); // Appeler startGame avec keepScore=true pour initialiser le jeu
            } else {
                goToNextLevel();
            }
        });
    }

    // Fonction pour passer au niveau suivant
    function goToNextLevel() {
        if (currentLevel < 2) {
            currentLevel++;
            document.getElementById('level-value').textContent = currentLevel;
            
            // Réinitialiser le score et le combo
            score = 0;
            combo = 0;
            totalAnswers = 0;
            correctAnswers = 0;
            
            document.getElementById('score-value').textContent = score;
            document.getElementById('combo-value').textContent = 'x1';
            
            // Réinitialiser la barre de progression
            document.getElementById('progress-fill').style.width = '0%';
            document.getElementById('current-points').textContent = '0';
            document.getElementById('points-needed').textContent = POINTS_FOR_NEXT_LEVEL[currentLevel];
            
            // Nettoyer les données du jeu mais conserver les badges
            allNodes.clear();
            allLinks.clear();
            guessedElements.clear();
            
            // Masquer la modal
            nextLevelModal.style.display = 'none';
            
            // Démarrer une nouvelle partie au niveau 2
            startGame(true);
        }
    }

    // Fonction pour gérer le timer
    function startTimer() {
        if (currentLevel === 2) {
            const config = LEVEL_CONFIG[currentLevel];
            timeLeft = config.timeLimit;
            
            // Créer ou mettre à jour l'élément du timer
            let timerElement = document.getElementById('timer');
            if (!timerElement) {
                timerElement = document.createElement('div');
                timerElement.id = 'timer';
                document.getElementById('guess-container').querySelector('.guess-content').prepend(timerElement);
            }
            
            // Mettre à jour le timer chaque seconde
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                timeLeft--;
                
                // Mise à jour du texte du timer
                timerElement.textContent = `Temps restant : ${timeLeft}s`;
                
                // Gestion des états du timer
                if (timeLeft <= 10 && timeLeft > 5) {
                    timerElement.className = 'warning';
                } else if (timeLeft <= 5) {
                    timerElement.className = 'danger';
                } else {
                    timerElement.className = '';
                }
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    // Pénalité pour temps écoulé
                    updateScore(LEVEL_CONFIG[currentLevel].wrongAnswerPenalty, false);
                    hideGuessContainer();
                    Swal.fire({
                        title: 'Temps écoulé !',
                        text: 'Vous avez été trop lent...',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            }, 1000);

            // Initialiser le timer avec la classe normale
            timerElement.className = '';
            timerElement.textContent = `Temps restant : ${timeLeft}s`;
        }
    }

    // Fonction pour mettre à jour l'affichage des nœuds devinés
    function updateGuessedNodes() {
        allNodes.forEach(node => {
            if (guessedElements.has(node.id)) {
                if (node.element && node.element.classList) {
                    node.element.classList.add('guessed');
                    // Afficher le titre/nom sur le nœud
                    const label = node.element.querySelector('.node-label');
                    if (label) {
                        label.textContent = node.type === 'movie' ? node.data.title : node.data.name;
                    }
                }
            }
        });
    }

    // Modification de la fonction handleCorrectGuess
    function handleCorrectGuess(guessedElement) {
        guessedElements.add(guessedElement.id);
        updateGuessedNodes();
        
        // Mise à jour du score avec le combo
        const config = LEVEL_CONFIG[currentLevel];
        const basePoints = config.pointsPerCorrectAnswer;
        const comboMultiplier = Math.min(config.maxCombo, 1 + (combo * 0.5));
        const points = Math.round(basePoints * comboMultiplier);
        
        // Calcul du bonus de temps pour le niveau 2
        let timeBonus = 0;
        if (currentLevel === 2 && timeLeft > 0) {
            timeBonus = Math.min(25, Math.floor(timeLeft * 2));
        }
        
        updateScore(points + timeBonus, true);
        
        // Mise à jour du combo
        combo++;
        document.getElementById('combo-value').textContent = `x${comboMultiplier.toFixed(1)}`;
        
        // Animation de score positive
        showScoreAnimation(points + timeBonus, true);
        
        // Vérifier si on a atteint le niveau suivant
        if (score >= POINTS_FOR_NEXT_LEVEL[currentLevel] && currentLevel < 2) {
            nextLevelModal.style.display = 'flex';
        }
        
        // Mise à jour du debug
        updateDebugDisplay();
    }

    // Modification de la fonction handleWrongGuess
    function handleWrongGuess() {
        const config = LEVEL_CONFIG[currentLevel];
        updateScore(config.wrongAnswerPenalty, false);
        combo = 0;
        document.getElementById('combo-value').textContent = 'x1';
        
        // Animation de score négative
        showScoreAnimation(config.wrongAnswerPenalty, false);
        
        // Mise à jour du debug
        updateDebugDisplay();
    }

    // Modification de la fonction startGame
    async function startGame(keepScore = false) {
        try {
            // Nettoyer le conteneur du graphe
            const graphContainer = document.getElementById('graph-container');
            graphContainer.innerHTML = '';
            
            // Réinitialisation des données
            allNodes.clear();
            allLinks.clear();
            guessedElements.clear();
            
            if (!keepScore) {
                // Réinitialiser le score et le niveau seulement si on ne garde pas le score
                score = 0;
                combo = 0;
                currentLevel = 1;
                document.getElementById('score-value').textContent = '0';
                document.getElementById('combo-value').textContent = 'x1';
                document.getElementById('level-value').textContent = '1';
                updateLevelProgress();
                
                // Afficher l'explication du niveau 1 uniquement au début du jeu
                showLevelExplanation(1);
                return;
            }

            // Appel à l'API pour obtenir un élément de départ aléatoire
            const response = await fetch('http://localhost:3000/api/game/start');
            const data = await response.json();

            currentElement = {
                id: data.data.id,
                type: data.type,
                title: data.data.title,
                name: data.data.name
            };
            
            // Récupération des éléments connectés selon le type
            if (data.type === 'movie') {
                connectedElements = await fetchConnections(currentElement.id, 'movie');
            } else if (data.type === 'actor') {
                connectedElements = await fetchConnections(currentElement.id, 'actor');
            }

            // Ajout du nœud initial
            addNode({
                id: currentElement.id,
                type: data.type,
                data: currentElement
            });

            // Ajout des nœuds connectés
            connectedElements.forEach(element => {
                addNode(element);
                addLink(currentElement.id, element.id);
            });

            // Mise à jour du debug
            updateDebugDisplay();

            // Création du graphe
            graph = new Graph('#graph-container', onNodeClick);

            // Mise à jour du graphe avec les données initiales
            graph.update(getGraphData());

            // Affichage de l'écran de jeu
            startScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');

            hideGuessContainer();

        } catch (error) {
            console.error('Erreur lors du démarrage du jeu:', error);
            Swal.fire({
                title: 'Erreur',
                text: 'Une erreur est survenue lors du démarrage du jeu. Veuillez réessayer.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Fonction appelée lorsqu'un nœud est cliqué
    function onNodeClick(node) {
        console.log('Nœud cliqué:', node);
        console.log('Type du nœud:', node.type);
        console.log('Type de l\'élément courant:', currentElement.type);
        console.log('Nœud déjà deviné:', guessedElements.has(node.id));
        
        // Vérifier si c'est un nœud initial (directement connecté à l'élément de départ)
        const isInitialNode = Array.from(allLinks).some(link => {
            const [sourceId, targetId] = link.split('-');
            return (sourceId === currentElement.id && targetId === node.id) ||
                   (sourceId === node.id && targetId === currentElement.id);
        });

        // Si c'est un nœud initial ou s'il est connecté à un élément déjà deviné
        if ((isInitialNode || Array.from(allLinks).some(link => {
            const [sourceId, targetId] = link.split('-');
            return (sourceId === node.id && guessedElements.has(targetId)) ||
                   (targetId === node.id && guessedElements.has(sourceId));
        })) && !guessedElements.has(node.id)) {
            console.log('Nœud valide pour la devinette');
            selectedElementId = node.id;
            showGuessContainer();
        } else {
            console.log('Nœud non valide pour la devinette');
        }
    }

    // Fonction pour récupérer l'image depuis Wikipedia
    async function fetchWikipediaImage(query, type) {
        try {
            // Pour les films, on utilise l'ID directement
            if (type === 'movie') {
                const response = await fetch(`http://localhost:3000/api/game/movies/${query}/wiki`);
                const data = await response.json();
                return data.imageUrl || null;
            }
            // Pour les acteurs, on utilise une recherche
            else {
                const response = await fetch(`http://localhost:3000/api/game/actors/${query}/wiki`);
                const data = await response.json();
                return data.imageUrl || null;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'image:', error);
            return null;
        }
    }

    // Fonction pour afficher le conteneur de devinette
    async function showGuessContainer() {
        if (!selectedElementId) return;

        const selectedNode = Array.from(allNodes.values()).find(n => n.id === selectedElementId);
        if (!selectedNode) return;

        // Réinitialiser les indices
        revealedIndices.clear();
        currentAnswer = selectedNode.type === 'movie' ? selectedNode.data.title : selectedNode.data.name;
        
        // Afficher l'image
        const guessImage = document.getElementById('guess-image');
        guessImage.style.display = 'block';
        const imageUrl = await fetchWikipediaImage(selectedNode.id, selectedNode.type);
        if (imageUrl) {
            guessImage.src = imageUrl;
        } else {
            guessImage.src = selectedNode.type === 'movie' ? 'placeholder-movie.jpg' : 'placeholder-actor.jpg';
        }
        guessImage.alt = `Image de ${currentAnswer}`;

        // Récupérer les éléments connectés pour des questions plus contextuelles
        try {
            const response = await fetch(`http://localhost:3000/api/connections/${selectedNode.id}`);
            const data = await response.json();
            const connectedElements = data.connections;

            // Générer une question contextuelle
            const questionElement = document.getElementById('guess-question');
            questionElement.textContent = generateQuestion(selectedNode, connectedElements);
        } catch (error) {
            console.error('Erreur lors de la récupération des connexions:', error);
            const questionElement = document.getElementById('guess-question');
            questionElement.textContent = generateQuestion(selectedNode);
        }

        // Initialiser l'affichage de l'indice
        updateHintDisplay();

        // Afficher le conteneur de devinette et le debug
        overlay.classList.add('visible');
        guessContainer.classList.add('visible');
        debugContainer.classList.add('visible');
        elementGuessInput.value = '';
        elementGuessInput.focus();

        // Mettre à jour le debug
        updateDebugDisplay();

        // Démarrer le timer pour le niveau 2 immédiatement après l'affichage du popup
        if (currentLevel === 2) {
            // Petit délai pour s'assurer que le popup est affiché
            setTimeout(() => {
                startTimer();
            }, 100);
        }
    }

    // Fonction pour masquer le conteneur de devinette
    function hideGuessContainer() {
        overlay.classList.remove('visible');
        guessContainer.classList.remove('visible');
        debugContainer.classList.remove('visible');
        selectedElementId = null;
        
        // Arrêter le timer et supprimer l'élément
        if (timerInterval) {
            clearInterval(timerInterval);
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.remove();
            }
        }
    }

    // Modification de la fonction checkGuess
    async function checkGuess(guess) {
        if (!selectedElementId) {
            console.log('Aucun élément sélectionné');
            return false;
        }

        totalAnswers++;
        const normalizedGuess = guess.toLowerCase().trim();
        
        const foundElement = Array.from(allNodes.values()).find(node => {
            if (guessedElements.has(node.id)) return false;
            
            const elementName = node.type === 'movie' ? node.data.title : node.data.name;
            return node.id === selectedElementId && 
                   elementName.toLowerCase() === normalizedGuess;
        });

        if (foundElement) {
            correctAnswers++;
            const points = 25;
            updateScore(points, true);

            guessedElements.add(foundElement.id);
            
            // Afficher l'élément dans la liste des éléments devinés
            const elementDiv = document.createElement('div');
            elementDiv.className = 'guessed-actor';
            elementDiv.textContent = foundElement.type === 'movie' ? foundElement.data.title : foundElement.data.name;
            guessedActorsElement.appendChild(elementDiv);

            // Récupérer les nouvelles connexions
            const newConnections = await fetchConnections(foundElement.id, foundElement.type);
            
            // Ajouter les nouveaux nœuds et liens
            newConnections.forEach(connection => {
                if (addNode(connection)) {
                    addLink(foundElement.id, connection.id);
                }
            });

            // Mettre à jour le nœud trouvé dans le graphe
            const node = Array.from(allNodes.values()).find(n => n.id === foundElement.id);
            if (node) {
                node.hidden = false;
            }

            // Mettre à jour le graphe
            graph.update(getGraphData());

            // Mettre à jour les éléments connectés
            connectedElements = Array.from(allNodes.values())
                .filter(node => 
                    node.id !== currentElement.id && 
                    !guessedElements.has(node.id) &&
                    Array.from(allLinks).some(link => {
                        const [sourceId, targetId] = link.split('-');
                        return (sourceId === currentElement.id && targetId === node.id) ||
                               (sourceId === node.id && targetId === currentElement.id);
                    })
                );

            // Mettre à jour le debug
            updateDebugDisplay();

            // Vérifier si tous les éléments ont été trouvés
            if (guessedElements.size === connectedElements.length) {
                Swal.fire({
                    title: 'Félicitations !',
                    text: 'Vous avez trouvé tous les éléments !',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            }

            hideGuessContainer();

            // Vérifier les badges après une bonne réponse
            checkAndAwardBadges();
            return true;
        } else {
            console.log('Aucun élément trouvé');
            resetCombo();
            updateScore(-10, false);
            
            Swal.fire({
                title: 'Réponse incorrecte',
                text: 'Ce n\'est pas la bonne réponse. Essayez encore !',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return false;
        }
    }

    // Écouteurs d'événements
    startButton.addEventListener('click', () => {
        startGame();
    });

    submitGuessButton.addEventListener('click', () => {
        const guess = elementGuessInput.value;
        if (guess.trim()) {
            checkGuess(guess);
        }
    });

    cancelGuessButton.addEventListener('click', hideGuessContainer);

    elementGuessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitGuessButton.click();
        } else if (e.key === 'Escape') {
            hideGuessContainer();
        }
    });

    // Ajout de l'écouteur d'événement pour le bouton d'indice
    document.getElementById('get-hint').addEventListener('click', getNewHint);

    // Écouteurs d'événements pour les boutons de niveau
    document.getElementById('next-level').addEventListener('click', goToNextLevel);
    document.getElementById('continue-level').addEventListener('click', () => {
        nextLevelModal.style.display = 'none';
    });

    // Fonction pour démarrer une nouvelle partie au niveau actuel
    function startNewGame() {
        Swal.fire({
            title: 'Nouvelle partie',
            text: 'Voulez-vous vraiment recommencer une nouvelle partie ? Votre progression actuelle sera perdue.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, recommencer',
            cancelButtonText: 'Non, continuer'
        }).then((result) => {
            if (result.isConfirmed) {
                const currentLevelBackup = currentLevel; // Sauvegarder le niveau actuel
                
                // Réinitialiser le jeu
                score = 0;
                combo = 0;
                allNodes.clear();
                allLinks.clear();
                guessedElements.clear();
                
                // Mettre à jour l'interface
                document.getElementById('score-value').textContent = '0';
                document.getElementById('combo-value').textContent = 'x1';
                updateLevelProgress();
                
                // Redémarrer au même niveau
                if (currentLevelBackup === 1) {
                    showLevelExplanation(1);
                } else {
                    currentLevel = currentLevelBackup;
                    document.getElementById('level-value').textContent = currentLevelBackup;
                    startGame(true);
                }
            }
        });
    }

    // Modification des écouteurs d'événements pour les boutons
    saveButtonsContainer.querySelector('.new-game-button').addEventListener('click', startNewGame);
    saveButtonsContainer.querySelector('.load-button').addEventListener('click', loadGameState);

    // Fonction pour sauvegarder l'état du jeu
    function saveGameState() {
        const gameState = {
            score,
            combo,
            currentLevel,
            guessedElements: Array.from(guessedElements),
            allNodes: Array.from(allNodes.entries()),
            allLinks: Array.from(allLinks),
            currentElement,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('gameState', JSON.stringify(gameState));
            
            // Feedback visuel
            saveButtonsContainer.classList.add('save-feedback');
            setTimeout(() => {
                saveButtonsContainer.classList.remove('save-feedback');
            }, 300);

            Swal.fire({
                title: 'Partie sauvegardée !',
                text: 'Votre progression a été enregistrée',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            Swal.fire({
                title: 'Erreur',
                text: 'Impossible de sauvegarder la partie',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Fonction pour charger l'état du jeu
    async function loadGameState() {
        try {
            const savedState = localStorage.getItem('gameState');
            if (!savedState) {
                Swal.fire({
                    title: 'Aucune sauvegarde',
                    text: 'Aucune partie sauvegardée n\'a été trouvée',
                    icon: 'info',
                    confirmButtonText: 'OK'
                });
                return;
            }

            const gameState = JSON.parse(savedState);
            
            // Vérifier si la sauvegarde date de plus de 24h
            if (Date.now() - gameState.timestamp > 24 * 60 * 60 * 1000) {
                Swal.fire({
                    title: 'Sauvegarde expirée',
                    text: 'La sauvegarde date de plus de 24h et n\'est plus valide',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
                localStorage.removeItem('gameState');
                return;
            }

            // Restaurer l'état du jeu
            score = gameState.score;
            combo = gameState.combo;
            currentLevel = gameState.currentLevel;
            guessedElements = new Set(gameState.guessedElements);
            allNodes = new Map(gameState.allNodes);
            allLinks = new Set(gameState.allLinks);
            currentElement = gameState.currentElement;

            // Mettre à jour l'interface
            document.getElementById('score-value').textContent = score;
            document.getElementById('combo-value').textContent = `x${Math.min(LEVEL_CONFIG[currentLevel].maxCombo, 1 + (combo * 0.5)).toFixed(1)}`;
            document.getElementById('level-value').textContent = currentLevel;
            updateLevelProgress();

            // Recréer le graphe
            graphContainer.innerHTML = '';
            graph = new Graph('#graph-container', onNodeClick);
            graph.update(getGraphData());

            // Mettre à jour le debug
            updateDebugDisplay();

            // Afficher l'écran de jeu
            startScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');

            Swal.fire({
                title: 'Partie chargée !',
                text: 'Votre progression a été restaurée',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            Swal.fire({
                title: 'Erreur',
                text: 'Impossible de charger la partie',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Vérifier s'il y a une sauvegarde au chargement
    document.addEventListener('DOMContentLoaded', () => {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            // Vérifier si la sauvegarde date de moins de 24h
            if (Date.now() - gameState.timestamp <= 24 * 60 * 60 * 1000) {
                Swal.fire({
                    title: 'Partie sauvegardée trouvée',
                    text: 'Voulez-vous charger votre dernière partie ?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Oui, charger',
                    cancelButtonText: 'Non, nouvelle partie'
                }).then((result) => {
                    if (result.isConfirmed) {
                        loadGameState();
                    }
                });
            } else {
                localStorage.removeItem('gameState');
            }
        }
    });

    // Fonction pour afficher les statistiques
    async function showStats() {
        try {
            // Récupérer les statistiques des films
            const moviesResponse = await fetch('http://localhost:3000/api/movies/stats');
            const movieStats = await moviesResponse.json();

            // Récupérer les statistiques des acteurs
            const actorsResponse = await fetch('http://localhost:3000/api/actors/stats');
            const actorStats = await actorsResponse.json();

            // Préparer les données pour le graphique
            const data = [
                { category: 'Films', value: movieStats.totalMovies },
                { category: 'Acteurs', value: actorStats.totalActors },
                { category: 'Moyenne', value: Math.round(movieStats.avgActorsPerMovie * 10) / 10 }
            ];

            // Configuration du graphique
            const width = 640;
            const height = 400;
            const marginTop = 20;
            const marginRight = 20;
            const marginBottom = 30;
            const marginLeft = 40;

            // Créer les échelles
            const x = d3.scaleBand()
                .domain(data.map(d => d.category))
                .range([marginLeft, width - marginRight])
                .padding(0.1);

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.value)]).nice()
                .range([height - marginBottom, marginTop]);

            // Créer le SVG
            const svg = d3.create("svg")
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

            // Ajouter les barres
            svg.append("g")
                .attr("fill", "#2196F3")
                .selectAll("rect")
                .data(data)
                .join("rect")
                .attr("x", d => x(d.category))
                .attr("y", d => y(d.value))
                .attr("height", d => y(0) - y(d.value))
                .attr("width", x.bandwidth());

            // Ajouter l'axe X
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "middle");

            // Ajouter l'axe Y
            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y))
                .call(g => g.select(".domain").remove());

            // Ajouter les valeurs au-dessus des barres
            svg.append("g")
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .selectAll("text")
                .data(data)
                .join("text")
                .attr("x", d => x(d.category) + x.bandwidth() / 2)
                .attr("y", d => y(d.value) - 4)
                .text(d => d.value);

            Swal.fire({
                title: 'Statistiques du jeu',
                html: `
                    <div class="stats-container">
                        ${svg.node().outerHTML}
                    </div>
                `,
                width: 700,
                icon: 'info',
                confirmButtonText: 'Fermer',
                customClass: {
                    popup: 'stats-popup',
                    content: 'stats-content'
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            Swal.fire({
                title: 'Erreur',
                text: 'Impossible de récupérer les statistiques',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Ajout de l'écouteur d'événement pour le bouton des statistiques
    saveButtonsContainer.querySelector('.stats-button').addEventListener('click', showStats);

    // Modification de la fonction checkAndAwardBadges
    function checkAndAwardBadges() {
        // Vérifier les badges basés sur le combo et le nombre de réponses
        Object.entries(BADGES).forEach(([key, badge]) => {
            if (badge.comboRequired && 
                combo >= badge.comboRequired && 
                correctAnswers >= badge.minAnswers && 
                !earnedBadges.has(key)) {
                awardBadge(key);
            }
        });
    }

    // Modification de la fonction awardBadge
    function awardBadge(badgeKey) {
        earnedBadges.add(badgeKey);
        availableBadges.add(badgeKey);
        
        const badge = BADGES[badgeKey];
        Swal.fire({
            title: 'Nouveau badge obtenu !',
            html: `
                <div style="text-align: center;">
                    <div style="font-size: 48px;">${badge.icon}</div>
                    <h3 style="color: ${badge.color};">${badge.name}</h3>
                    <p>${badge.description}</p>
                    <p>Vous pouvez maintenant utiliser ce badge pour révéler une réponse !</p>
                    <button class="swal2-confirm swal2-styled" onclick="useBadge('${badgeKey}')">Utiliser le badge</button>
                </div>
            `,
            icon: 'success',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Fermer'
        });

        // Mettre à jour l'affichage des badges
        updateBadgesDisplay();
    }

    // Modification de la fonction updateBadgesDisplay
    function updateBadgesDisplay() {
        const badgesContainer = document.getElementById('badges-container') || createBadgesContainer();
        badgesContainer.innerHTML = '';

        availableBadges.forEach(badgeKey => {
            const badge = BADGES[badgeKey];
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge';
            badgeElement.style.backgroundColor = badge.color;
            badgeElement.innerHTML = `
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-tooltip">
                    <strong>${badge.name}</strong>
                    <p>${badge.description}</p>
                    <p>Utilisations : ${badge.uses}/${badge.maxUses}</p>
                    <button class="use-badge" data-badge="${badgeKey}">Utiliser</button>
                </div>
            `;
            badgesContainer.appendChild(badgeElement);
        });
    }

    // Fonction pour créer le conteneur de badges
    function createBadgesContainer() {
        const container = document.createElement('div');
        container.id = 'badges-container';
        container.className = 'badges-container';
        document.body.appendChild(container);
        return container;
    }

    // Modification de la fonction useBadge
    function useBadge(badgeKey) {
        if (!selectedElementId) {
            Swal.fire({
                title: 'Erreur',
                text: 'Vous devez d\'abord sélectionner un élément à deviner',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        const badge = BADGES[badgeKey];
        if (badge.uses >= badge.maxUses) {
            Swal.fire({
                title: 'Badge épuisé',
                text: 'Vous avez déjà utilisé ce badge le nombre maximum de fois.',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        const selectedNode = Array.from(allNodes.values()).find(n => n.id === selectedElementId);
        if (!selectedNode) return;

        const answer = selectedNode.type === 'movie' ? selectedNode.data.title : selectedNode.data.name;
        
        // Remplir le champ de devinette avec la réponse
        const elementGuessInput = document.getElementById('element-guess');
        if (elementGuessInput) {
            elementGuessInput.value = answer;
        }

        // Incrémenter le compteur d'utilisations
        badge.uses++;
        
        // Si le badge est épuisé, le retirer de l'affichage
        if (badge.uses >= badge.maxUses) {
            availableBadges.delete(badgeKey);
        }
        
        updateBadgesDisplay();
        
        Swal.fire({
            title: 'Badge utilisé !',
            text: `Le nom a été automatiquement rempli dans le champ de devinette. (${badge.uses}/${badge.maxUses} utilisations)`,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }

    // Ajout de l'écouteur d'événements pour les badges
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('use-badge')) {
            const badgeKey = e.target.dataset.badge;
            useBadge(badgeKey);
        }
    });

    // Ajout des styles pour les badges
    const badgeStyles = document.createElement('style');
    badgeStyles.textContent = `
        .badges-container {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .badge {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            transition: transform 0.3s ease;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .badge:hover {
            transform: scale(1.1);
        }

        .badge-icon {
            font-size: 24px;
        }

        .badge-tooltip {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            width: 200px;
            z-index: 1001;
        }

        .badge:hover .badge-tooltip {
            display: block;
        }

        .use-badge {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 5px;
            width: 100%;
        }

        .use-badge:hover {
            background: #45a049;
        }
    `;
    document.head.appendChild(badgeStyles);

    // Ajout des styles pour le conteneur de debug
    const debugStyles = document.createElement('style');
    debugStyles.textContent = `
        #debug-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            max-width: 300px;
            display: none;
        }

        #debug-container.visible {
            display: block;
        }

        .debug-section {
            margin-bottom: 10px;
        }

        .debug-section h4 {
            margin: 0 0 5px 0;
            color: #2c3e50;
        }

        .debug-element {
            background: #f8f9fa;
            padding: 5px;
            border-radius: 4px;
            margin-bottom: 5px;
        }

        .debug-answer {
            background: #f8f9fa;
            padding: 5px;
            border-radius: 4px;
            margin-bottom: 5px;
        }

        .debug-answer.guessed {
            background: #d4edda;
            color: #155724;
        }

        .debug-connection {
            background: #f8f9fa;
            padding: 5px;
            border-radius: 4px;
            margin-bottom: 5px;
        }

        .debug-connection.guessed {
            background: #d4edda;
            color: #155724;
        }

        .connection-header {
            font-weight: bold;
        }

        .connection-details {
            font-size: 0.9em;
            color: #6c757d;
        }
    `;
    document.head.appendChild(debugStyles);
}); 